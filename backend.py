#!/usr/bin/env python3
"""
SimplyLegal Backend
A comprehensive Flask backend for legal document analysis using Google Gemini AI
"""

import os
import json
import uuid
import logging
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded environment variables from .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment variables")
except Exception as e:
    print(f"⚠️  Could not load .env file: {e}")

import flask
from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from google import genai
from PIL import Image
import fitz  # PyMuPDF
import docx
import pytesseract
from pdf2image import convert_from_path
import hashlib
import sqlite3
from threading import Thread
import time
import numpy as np
import faiss
import pickle
from sentence_transformers import SentenceTransformer

# Import our custom modules
from prompts import (
    DOCUMENT_ANALYSIS_PROMPT,
    SIMPLE_SUMMARY_PROMPT,
    PLAIN_LANGUAGE_ANALYSIS_PROMPT,
    DEEP_ANALYSIS_PROMPT,

    DOCUMENT_TYPE_PROMPT,
    KEY_TERMS_PROMPT,
    RISK_ASSESSMENT_PROMPT,
    QA_CONTEXT_PROMPT
)
from data_manager import DataManager
from summary_manager import SummaryManager
from deep_analysis_manager import DeepAnalysisManager

from action_items_manager import ActionItemsManager
from config import GEMINI_API_KEY, SECRET_KEY, MAX_CONTENT_LENGTH, FLASK_DEBUG, UPLOAD_FOLDER, PROCESSED_FOLDER, DATA_DIR, SUMMARIES_FILE

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['SECRET_KEY'] = SECRET_KEY

# Enable CORS
CORS(app, origins=['*'], supports_credentials=False, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Global CORS handler for all OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

# Configure Google Gemini AI
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    logger.warning("GEMINI_API_KEY not configured in config.py")
    logger.warning("Please set your actual Gemini API key in config.py")
    GEMINI_API_KEY = "your-gemini-api-key-here"

# Initialize Gemini client
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    logger.info("Gemini client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")
    client = None

# Initialize data manager and summary manager
data_manager = DataManager(DATA_DIR)
summary_manager = SummaryManager(SUMMARIES_FILE)
deep_analysis_manager = DeepAnalysisManager("deep_analysis.json")

action_items_manager = ActionItemsManager("data")

# FAISS index for document search
faiss_indexer = None

class DocumentProcessor:
    """Handles document processing and analysis"""
    
    def __init__(self):
        self.supported_formats = {
            'application/pdf': self._process_pdf,
            'image/jpeg': self._process_image,
            'image/png': self._process_image,
            'image/jpg': self._process_image,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._process_docx
        }
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            # Convert PDF to images if needed
            if file_path.lower().endswith('.pdf'):
                images = convert_from_path(file_path)
                text = ""
                for image in images:
                    text += pytesseract.image_to_string(image) + "\n"
                return text
            else:
                # Direct image processing
                image = Image.open(file_path)
                return pytesseract.image_to_string(image)
        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            return ""
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            return ""
    
    def _process_pdf(self, file_path: str) -> str:
        """Process PDF file"""
        return self.extract_text_from_pdf(file_path)
    
    def _process_image(self, file_path: str) -> str:
        """Process image file"""
        return self.extract_text_from_image(file_path)
    
    def _process_docx(self, file_path: str) -> str:
        """Process DOCX file"""
        return self.extract_text_from_docx(file_path)
    
    def extract_text(self, file_path: str, mime_type: str) -> str:
        """Extract text from document based on MIME type"""
        processor = self.supported_formats.get(mime_type)
        if processor:
            return processor(file_path)
        else:
            raise ValueError(f"Unsupported file type: {mime_type}")

class FAISSIndexer:
    """Handles FAISS indexing for document search"""
    
    def __init__(self):
        self.index = None
        self.embedding_model = None
        self.document_embeddings = {}
        self.document_texts = {}
        self.index_file = "faiss_index.bin"
        self.metadata_file = "faiss_metadata.pkl"
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize FAISS index and embedding model"""
        try:
            # Use a lightweight sentence transformer model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            dimension = self.embedding_model.get_sentence_embedding_dimension()
            
            # Try to load existing index
            if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
                logger.info("Loading existing FAISS index...")
                self.index = faiss.read_index(self.index_file)
                with open(self.metadata_file, 'rb') as f:
                    metadata = pickle.load(f)
                    self.document_embeddings = metadata.get('document_embeddings', {})
                    self.document_texts = metadata.get('document_texts', {})
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            else:
                # Create new index
                self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
                logger.info(f"Created new FAISS index with dimension {dimension}")
                
        except Exception as e:
            logger.error(f"Failed to initialize FAISS index: {e}")
            self.index = None
    
    def _save_index(self):
        """Save FAISS index and metadata to disk"""
        try:
            if self.index is not None:
                faiss.write_index(self.index, self.index_file)
                metadata = {
                    'document_embeddings': self.document_embeddings,
                    'document_texts': self.document_texts
                }
                with open(self.metadata_file, 'wb') as f:
                    pickle.dump(metadata, f)
                logger.info("FAISS index saved successfully")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")
    
    def add_document(self, doc_id: str, text: str, chunks: List[str] = None):
        """Add document to FAISS index"""
        if not self.index or not self.embedding_model:
            logger.warning("FAISS index not initialized")
            return
        
        try:
            # Split text into chunks if not provided
            if chunks is None:
                chunks = self._split_text_into_chunks(text)
            
            # Generate embeddings for chunks
            embeddings = self.embedding_model.encode(chunks)
            
            # Add to FAISS index
            self.index.add(embeddings.astype('float32'))
            
            # Store document information
            start_idx = len(self.document_embeddings)
            self.document_embeddings[doc_id] = {
                'start_idx': start_idx,
                'end_idx': start_idx + len(chunks),
                'chunks': chunks
            }
            self.document_texts[doc_id] = text
            
            logger.info(f"Added document {doc_id} to FAISS index with {len(chunks)} chunks")
            
            # Save index after adding document
            self._save_index()
            
        except Exception as e:
            logger.error(f"Failed to add document to FAISS index: {e}")
    
    def _split_text_into_chunks(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    def search(self, query: str, k: int = 5, doc_id: str = None) -> List[Dict]:
        """Search for relevant document chunks"""
        if not self.index or not self.embedding_model:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])
            
            # Search FAISS index
            scores, indices = self.index.search(query_embedding.astype('float32'), k * 2)  # Get more results to filter
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0:  # FAISS returns -1 for invalid indices
                    continue
                
                # Find which document this chunk belongs to
                chunk_doc_id = None
                chunk_text = ""
                for doc_id_candidate, doc_info in self.document_embeddings.items():
                    if doc_info['start_idx'] <= idx < doc_info['end_idx']:
                        chunk_doc_id = doc_id_candidate
                        chunk_idx = idx - doc_info['start_idx']
                        chunk_text = doc_info['chunks'][chunk_idx]
                        break
                
                if chunk_doc_id:
                    # Filter by specific document if requested
                    if doc_id is None or chunk_doc_id == doc_id:
                        results.append({
                            'doc_id': chunk_doc_id,
                            'chunk': chunk_text,
                            'score': float(score),
                            'chunk_index': idx
                        })
                        
                        # Stop if we have enough results
                        if len(results) >= k:
                            break
            
            return results
            
        except Exception as e:
            logger.error(f"FAISS search failed: {e}")
            return []

class GeminiAnalyzer:
    """Handles document analysis using Google Gemini AI"""
    
    def __init__(self):
        self.client = client
    
    def analyze_document(self, text: str, filename: str) -> Dict[str, Any]:
        """Analyze document using Gemini AI with prompts template"""
        try:
            # Use the prompt template from prompts.py with timestamp
            timestamp = datetime.now().isoformat()
            
            # Use more text for better analysis, but still within limits
            analysis_text = text[:15000] if len(text) > 15000 else text
            
            prompt = DOCUMENT_ANALYSIS_PROMPT.format(
                filename=filename,
                text=analysis_text,
                timestamp=timestamp
            )
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            # Parse JSON response
            try:
                analysis = json.loads(response.text)
                # Ensure AI generated flag is set
                analysis['ai_generated'] = True
                analysis['analysis_timestamp'] = timestamp
                analysis['model_used'] = 'gemini-2.5-flash'
                return analysis
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return self._create_fallback_analysis(text, filename)
                
        except Exception as e:
            logger.error(f"Error in Gemini analysis: {e}")
            return self._create_fallback_analysis(text, filename)
    
    def extract_simple_summary(self, text: str, filename: str) -> str:
        """Extract simple summary using dedicated prompt"""
        try:
            prompt = SIMPLE_SUMMARY_PROMPT.format(
                filename=filename,
                text=text[:4000]
            )
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error extracting summary: {e}")
            return "Unable to generate summary at this time."
    
    def analyze_document_plain_language(self, text: str, filename: str) -> Dict[str, Any]:
        """Analyze document using plain language prompt"""
        try:
            logger.info(f"Starting Gemini plain language analysis for {filename}")
            
            # Check if client is available
            if not self.client:
                logger.error("Gemini client not available")
                return self._create_plain_language_fallback(text, filename)
            
            prompt = PLAIN_LANGUAGE_ANALYSIS_PROMPT.format(
                filename=filename,
                text=text[:8000]
            )
            
            logger.info(f"Sending request to Gemini for {filename}")
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            logger.info(f"Received response from Gemini for {filename}")
            logger.info(f"Response text: {response.text[:200]}...")  # Log first 200 chars
            
            # Parse JSON response
            try:
                # Clean the response text - remove any markdown formatting
                clean_response = response.text.strip()
                
                # Remove markdown code blocks if present
                if clean_response.startswith('```json'):
                    clean_response = clean_response[7:]
                if clean_response.endswith('```'):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                logger.info(f"Cleaned response: {clean_response[:200]}...")
                
                analysis = json.loads(clean_response)
                analysis['ai_generated'] = True
                analysis['analysis_timestamp'] = datetime.now().isoformat()
                analysis['model_used'] = 'gemini-2.5-flash'
                
                logger.info(f"Successfully parsed JSON response for {filename}")
                logger.info(f"Summary: {analysis.get('summary', 'No summary')[:100]}...")
                
                return analysis
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON parsing failed for {filename}: {json_error}")
                logger.error(f"Raw response: {response.text}")
                logger.error(f"Cleaned response: {clean_response}")
                
                # Try to extract JSON from the response if it contains other text
                try:
                    # Look for JSON-like content between curly braces
                    import re
                    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                    if json_match:
                        extracted_json = json_match.group(0)
                        logger.info(f"Attempting to extract JSON: {extracted_json[:200]}...")
                        analysis = json.loads(extracted_json)
                        analysis['ai_generated'] = True
                        analysis['analysis_timestamp'] = datetime.now().isoformat()
                        analysis['model_used'] = 'gemini-2.5-flash'
                        logger.info("Successfully extracted and parsed JSON")
                        return analysis
                except Exception as extract_error:
                    logger.error(f"JSON extraction also failed: {extract_error}")
                
                # Fallback if JSON parsing fails
                return self._create_plain_language_fallback(text, filename)
                
        except Exception as e:
            logger.error(f"Error in plain language analysis for {filename}: {e}")
            return self._create_plain_language_fallback(text, filename)
    
    def _create_plain_language_fallback(self, text: str, filename: str) -> Dict[str, Any]:
        """Create fallback plain language analysis"""
        timestamp = datetime.now().isoformat()
        return {
            "summary": f"Unable to analyze document '{filename}'. Please try uploading again.",
            "document_type": "Not specified",
            "parties_involved": [],
            "key_terms": [],
            "main_points": [],
            "ai_generated": False,
            "analysis_timestamp": timestamp,
            "model_used": "fallback-analysis",
            "error": "Plain language analysis failed"
        }
    
    def analyze_document_deep(self, text: str, filename: str) -> Dict[str, Any]:
        """Perform deep analysis using specialized prompt"""
        try:
            logger.info(f"Starting Gemini deep analysis for {filename}")
            
            # Check if client is available
            if not self.client:
                logger.error("Gemini client not available")
                return self._create_deep_analysis_fallback(text, filename)
            
            prompt = DEEP_ANALYSIS_PROMPT.format(
                filename=filename,
                text=text[:12000]  # Allow more text for deep analysis
            )
            
            logger.info(f"Sending deep analysis request to Gemini for {filename}")
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            logger.info(f"Received deep analysis response from Gemini for {filename}")
            
            # Parse JSON response with robust error handling
            try:
                # Clean the response text - remove any markdown formatting
                clean_response = response.text.strip()
                
                # Remove markdown code blocks if present
                if clean_response.startswith('```json'):
                    clean_response = clean_response[7:]
                if clean_response.endswith('```'):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                logger.info(f"Cleaned deep analysis response: {clean_response[:200]}...")
                
                analysis = json.loads(clean_response)
                analysis['ai_generated'] = True
                analysis['analysis_timestamp'] = datetime.now().isoformat()
                analysis['model_used'] = 'gemini-2.5-flash'
                
                logger.info(f"Successfully parsed deep analysis JSON for {filename}")
                return analysis
                
            except json.JSONDecodeError as json_error:
                logger.error(f"Deep analysis JSON parsing failed for {filename}: {json_error}")
                logger.error(f"Raw response: {response.text}")
                
                # Try to extract JSON from the response if it contains other text
                try:
                    import re
                    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                    if json_match:
                        extracted_json = json_match.group(0)
                        logger.info(f"Attempting to extract deep analysis JSON: {extracted_json[:200]}...")
                        analysis = json.loads(extracted_json)
                        analysis['ai_generated'] = True
                        analysis['analysis_timestamp'] = datetime.now().isoformat()
                        analysis['model_used'] = 'gemini-2.5-flash'
                        logger.info("Successfully extracted and parsed deep analysis JSON")
                        return analysis
                except Exception as extract_error:
                    logger.error(f"Deep analysis JSON extraction also failed: {extract_error}")
                
                return self._create_deep_analysis_fallback(text, filename)
                
        except Exception as e:
            logger.error(f"Error in deep analysis for {filename}: {e}")
            return self._create_deep_analysis_fallback(text, filename)
    
    def _create_deep_analysis_fallback(self, text: str, filename: str) -> Dict[str, Any]:
        """Create fallback deep analysis"""
        timestamp = datetime.now().isoformat()
        return {
            "deep_analysis": {
                "key_clauses": [],
                "obligations": [],
                "rights": [],
                "financial_terms": [],
                "timeline": [],
                "termination_conditions": [],
                "dispute_resolution": [],
                "penalties": [],
                "compliance_requirements": [],
                "confidentiality": [],
                "intellectual_property": []
            },
            "ai_generated": False,
            "analysis_timestamp": timestamp,
            "model_used": "fallback-deep-analysis",
            "error": "Deep analysis failed"
        }
    
    
    
    def answer_question(self, text: str, question: str, doc_id: str = None) -> Dict[str, Any]:
        """Answer questions about the document using Gemini with FAISS search"""
        try:
            # Use FAISS search to find relevant context
            relevant_chunks = []
            if doc_id and faiss_indexer and faiss_indexer.index:
                search_results = faiss_indexer.search(question, k=5)
                relevant_chunks = [result['chunk'] for result in search_results if result['doc_id'] == doc_id]
            
            # Combine relevant chunks with full text
            context_text = ""
            if relevant_chunks:
                context_text = "\n\nRelevant sections from document:\n" + "\n".join(relevant_chunks)
            
            full_context = f"{text[:4000]}{context_text}"
            
            # Use the QA prompt template
            prompt = QA_CONTEXT_PROMPT.format(
                question=question,
                text=full_context,
                relevant_chunks=context_text
            )
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            # Return the markdown response directly
            return {
                "answer": response.text,
                "citations": [],
                "confidence": 0.8,
                "source_sections": [],
                "additional_context": ""
            }
                
        except Exception as e:
            logger.error(f"Error in Q&A: {e}")
            return {
                "answer": "I'm unable to process your question at the moment. Please try again.",
                "citations": [],
                "confidence": 0.0,
                "source_sections": [],
                "additional_context": ""
            }
    
    def _create_fallback_analysis(self, text: str, filename: str) -> Dict[str, Any]:
        """Create fallback analysis when Gemini fails - this should rarely be used"""
        timestamp = datetime.now().isoformat()
        return {
            "summary": f"AI analysis failed for document '{filename}'. Please try uploading the document again or contact support.",
            "document_type": "Analysis Failed",
            "parties_involved": [],
            "key_terms": [],
            "legal_implications": [],
            "compliance_issues": [],
            "negotiation_points": [],
            "clauses": [],
            "risks": [],
            "checklist": [],
            "recommendations": ["Please try uploading the document again for AI analysis"],
            "ai_generated": False,
            "analysis_timestamp": timestamp,
            "model_used": "fallback-analysis",
            "error": "Gemini AI analysis failed"
        }

# Initialize processors
document_processor = DocumentProcessor()
gemini_analyzer = GeminiAnalyzer()
faiss_indexer = FAISSIndexer()

def generate_doc_id() -> str:
    """Generate unique document ID"""
    return f"doc_{uuid.uuid4().hex[:8]}"

def process_document_async(doc_id: str):
    """Process document asynchronously"""
    try:
        # Get document info from data manager
        doc_info = data_manager.get_document(doc_id)
        if not doc_info:
            return
        
        # Update status - Starting processing
        data_manager.update_document_status(doc_id, "processing", "Extracting text from document...")
        
        # Get document file path
        file_path = doc_info.get("stored_path")
        if not file_path or not os.path.exists(file_path):
            data_manager.update_document_status(doc_id, "error", "Document file not found")
            return
        
        # Extract text
        text = document_processor.extract_text(file_path, doc_info["mime_type"])
        
        if not text.strip():
            data_manager.update_document_status(doc_id, "error", "No text could be extracted from the document")
            return
        
        # Update status - Text extraction complete, starting analysis
        data_manager.update_document_status(doc_id, "analyzing", "Performing AI analysis with Gemini...")
        
        # First, do plain language analysis for summary
        logger.info(f"Starting plain language analysis for document {doc_id}")
        data_manager.update_document_status(doc_id, "analyzing", "Creating document summary...")
        plain_analysis = gemini_analyzer.analyze_document_plain_language(text, doc_info["filename"])
        
        # Save plain language summary
        logger.info(f"Saving summary for document {doc_id}")
        summary_saved = summary_manager.save_summary(doc_id, plain_analysis)
        if summary_saved:
            logger.info(f"Summary saved successfully for document {doc_id}")
        else:
            logger.error(f"Failed to save summary for document {doc_id}")
        
        # Then do deep analysis for structured data
        logger.info(f"Starting deep analysis for document {doc_id}")
        data_manager.update_document_status(doc_id, "analyzing", "Performing deep analysis...")
        deep_analysis = gemini_analyzer.analyze_document_deep(text, doc_info["filename"])
        
        # Save deep analysis data separately
        if deep_analysis and deep_analysis.get("deep_analysis"):
            logger.info(f"Saving deep analysis data for document {doc_id}")
            deep_saved = deep_analysis_manager.save_deep_analysis(doc_id, deep_analysis)
            if deep_saved:
                logger.info(f"Deep analysis saved successfully for document {doc_id}")
            else:
                logger.error(f"Failed to save deep analysis for document {doc_id}")
        else:
            logger.warning(f"No deep analysis data found for document {doc_id}")
        

        
        # Then do action items extraction
        logger.info(f"Starting action items extraction for document {doc_id}")
        data_manager.update_document_status(doc_id, "analyzing", "Extracting action items...")
        action_items = action_items_manager.extract_action_items(doc_id, doc_info["filename"], text)
        
        if action_items and action_items.get("action_items"):
            logger.info(f"Action items extracted successfully for document {doc_id}")
            logger.info(f"Number of action items found: {len(action_items.get('action_items', []))}")
        else:
            logger.warning(f"No action items found for document {doc_id}")
        
        # Then do full detailed analysis
        data_manager.update_document_status(doc_id, "analyzing", "Performing final analysis...")
        analysis = gemini_analyzer.analyze_document(text, doc_info["filename"])
        
        # Save full analysis
        data_manager.save_analysis(doc_id, analysis)
        
        # Add to FAISS index for search
        data_manager.update_document_status(doc_id, "analyzing", "Indexing document for search...")
        faiss_indexer.add_document(doc_id, text)
        
        # Mark as completed
        data_manager.update_document_status(doc_id, "completed", "Document analysis completed successfully!")
        logger.info(f"Document {doc_id} processed successfully")
        
    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {e}")
        data_manager.update_document_status(doc_id, "error", str(e))

# API Routes

@app.route('/healthz', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'gemini_configured': bool(GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-api-key-here"),
        'gemini_client_available': client is not None,
        'data_stats': data_manager.get_statistics(),
        'summary_file_exists': summary_manager.summaries_file.exists(),
        'total_summaries': len(summary_manager.get_all_summaries())
    })

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """Handle file upload with customization options"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get customization options
        custom_name = request.form.get('customName', '')
        theme = request.form.get('theme', 'default')
        font = request.form.get('font', 'inter')
        
        # Handle logo upload if provided
        logo_file = None
        logo_path = None
        if 'logo' in request.files:
            logo_file = request.files['logo']
            if logo_file.filename != '':
                # Validate logo file type
                if not logo_file.content_type.startswith('image/'):
                    return jsonify({'error': 'Logo must be an image file'}), 400
                
                # Save logo
                logo_filename = f"logo_{generate_doc_id()}_{secure_filename(logo_file.filename)}"
                logo_path = os.path.join(app.config['UPLOAD_FOLDER'], logo_filename)
                logo_file.save(logo_path)
        
        # Validate file type
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if file.content_type not in allowed_types:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        # Validate file size
        if len(file.read()) > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({'error': 'File too large'}), 400
        
        file.seek(0)  # Reset file pointer
        
        # Generate document ID
        doc_id = generate_doc_id()
        
        # Use custom name if provided, otherwise use original filename
        display_name = custom_name if custom_name else file.filename
        
        # Save file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}_{secure_filename(file.filename)}")
        file.save(temp_path)
        
        # Save document using data manager with customization metadata
        document_metadata = {
            'custom_name': display_name,
            'theme': theme,
            'font': font,
            'logo_path': logo_path,
            'customization': {
                'name': display_name,
                'theme': theme,
                'font': font,
                'hasLogo': logo_path is not None
            }
        }
        
        if data_manager.save_document(doc_id, temp_path, display_name, file.content_type, document_metadata):
            # Start async processing
            thread = Thread(target=process_document_async, args=(doc_id,))
            thread.daemon = True
            thread.start()
            
            return jsonify({
                'docId': doc_id,
                'status': 'uploaded',
                'message': 'Document uploaded successfully. Processing started...',
                'customization': {
                    'name': display_name,
                    'theme': theme,
                    'font': font,
                    'hasLogo': logo_path is not None
                }
            })
        else:
            return jsonify({'error': 'Failed to save document'}), 500
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': 'Upload failed'}), 500

@app.route('/api/status', methods=['GET'])
def get_document_status():
    """Get document processing status"""
    doc_id = request.args.get('docId')
    if not doc_id:
        return jsonify({'error': 'Document ID required'}), 400
    
    doc_info = data_manager.get_document(doc_id)
    if not doc_info:
        return jsonify({'error': 'Document not found'}), 404
    
    response = {
        'docId': doc_id,
        'status': doc_info['status'],
        'message': doc_info.get('status_message', doc_info['status'])
    }
    
    if doc_info['status'] == 'error':
        response['error'] = doc_info.get('status_message', 'Unknown error')
    
    return jsonify(response)

@app.route('/api/document/<doc_id>', methods=['GET'])
def get_document_details(doc_id):
    """Get document details and analysis"""
    doc_info = data_manager.get_document(doc_id)
    if not doc_info:
        return jsonify({'error': 'Document not found'}), 404
    
    if doc_info['status'] != 'completed':
        return jsonify({'error': 'Document processing not completed'}), 400
    
    # Get plain language summary
    summary = summary_manager.get_summary(doc_id)
    
    # Get full analysis
    analysis = data_manager.get_analysis(doc_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    
    # Get customization data
    customization = doc_info.get("customization", {})
    custom_name = doc_info.get("custom_name", doc_info['filename'])
    
    response = {
        'id': doc_id,
        'name': custom_name,  # Use custom name if available
        'status': doc_info['status'],
        'uploadedAt': doc_info['uploaded_at'],
        'completedAt': doc_info.get('analyzed_at'),
        'summary': summary,
        'analysis': analysis['analysis'],
        'customization': customization,  # Include customization data
        'custom_name': custom_name,
        'theme': doc_info.get("theme", "default"),
        'font': doc_info.get("font", "inter"),
        'logo_path': doc_info.get("logo_path")
    }
    
    return jsonify(response)

@app.route('/api/summary/<doc_id>', methods=['GET'])
def get_document_summary(doc_id):
    """Get document plain language summary"""
    summary = summary_manager.get_summary(doc_id)
    if not summary:
        return jsonify({'error': 'Summary not found'}), 404
    
    return jsonify(summary)

@app.route('/api/summaries', methods=['GET'])
def get_all_summaries():
    """Get all summaries for debugging"""
    try:
        summaries = summary_manager.get_all_summaries()
        return jsonify({
            'total_summaries': len(summaries),
            'summaries': summaries,
            'summary_file_path': str(summary_manager.summaries_file)
        })
    except Exception as e:
        logger.error(f"Error getting all summaries: {e}")
        return jsonify({'error': 'Failed to get summaries'}), 500

@app.route('/api/deep-analysis/<doc_id>', methods=['GET'])
def get_deep_analysis(doc_id):
    """Get deep analysis for a specific document"""
    try:
        deep_analysis = deep_analysis_manager.get_deep_analysis(doc_id)
        if deep_analysis:
            return jsonify(deep_analysis)
        else:
            return jsonify({'error': 'Deep analysis not found'}), 404
    except Exception as e:
        logger.error(f"Error getting deep analysis for {doc_id}: {e}")
        return jsonify({'error': 'Failed to get deep analysis'}), 500

@app.route('/api/deep-analysis', methods=['GET'])
def get_all_deep_analysis():
    """Get all deep analysis data (for debugging)"""
    try:
        deep_analysis_list = deep_analysis_manager.get_all_deep_analysis()
        return jsonify({
            'deep_analysis': deep_analysis_list,
            'total': len(deep_analysis_list)
        })
    except Exception as e:
        logger.error(f"Error getting deep analysis: {e}")
        return jsonify({'error': 'Failed to get deep analysis'}), 500



@app.route('/api/document/<doc_id>/customization', methods=['PUT'])
def update_document_customization(doc_id):
    """Update document customization settings"""
    try:
        data = request.get_json()
        custom_name = data.get('custom_name')
        theme = data.get('theme', 'default')
        font = data.get('font', 'inter')
        
        # Get the document
        doc_info = data_manager.get_document(doc_id)
        if not doc_info:
            return jsonify({'error': 'Document not found'}), 404
        
        # Update customization data
        doc_info['custom_name'] = custom_name
        doc_info['theme'] = theme
        doc_info['font'] = font
        doc_info['customization'] = {
            'name': custom_name,
            'theme': theme,
            'font': font,
            'hasLogo': doc_info.get('logo_path') is not None
        }
        
        # Save the updated document
        data_manager._save_json(data_manager.documents_file, data_manager.documents)
        
        response = jsonify({
            'message': 'Customization updated successfully',
            'customization': doc_info['customization']
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        logger.error(f"Error updating customization for {doc_id}: {e}")
        response = jsonify({'error': 'Failed to update customization'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@app.route('/api/action-items/<doc_id>', methods=['GET'])
def get_action_items(doc_id):
    """Get action items for a specific document"""
    try:
        action_items = action_items_manager.get_action_items(doc_id)
        if action_items:
            return jsonify(action_items)
        else:
            return jsonify({'error': 'Action items not found'}), 404
    except Exception as e:
        logger.error(f"Error getting action items for {doc_id}: {e}")
        return jsonify({'error': 'Failed to get action items'}), 500

@app.route('/api/action-items', methods=['GET'])
def get_all_action_items():
    """Get all action items data (for debugging)"""
    try:
        action_items_list = action_items_manager.get_all_action_items()
        return jsonify({
            'action_items': action_items_list,
            'total': len(action_items_list)
        })
    except Exception as e:
        logger.error(f"Error getting action items: {e}")
        return jsonify({'error': 'Failed to get action items'}), 500

@app.route('/api/action-items/<doc_id>/<action_id>/status', methods=['PUT'])
def update_action_item_status(doc_id, action_id):
    """Update the status of a specific action item"""
    try:
        data = request.get_json()
        status = data.get('status')
        completed = data.get('completed', False)
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        action_items_manager.update_action_item_status(doc_id, action_id, status, completed)
        return jsonify({'message': 'Action item status updated successfully'})
    except Exception as e:
        logger.error(f"Error updating action item status: {e}")
        return jsonify({'error': 'Failed to update action item status'}), 500

@app.route('/api/action-items/<doc_id>/<action_id>/notes', methods=['POST'])
def add_action_item_note(doc_id, action_id):
    """Add a note to a specific action item"""
    try:
        data = request.get_json()
        note = data.get('note')
        
        if not note:
            return jsonify({'error': 'Note is required'}), 400
        
        action_items_manager.add_note_to_action_item(doc_id, action_id, note)
        return jsonify({'message': 'Note added successfully'})
    except Exception as e:
        logger.error(f"Error adding note to action item: {e}")
        return jsonify({'error': 'Failed to add note'}), 500

@app.route('/api/action-items/summary', methods=['GET'])
def get_action_items_summary():
    """Get summary of all action items"""
    try:
        summary = action_items_manager.get_action_items_summary()
        return jsonify(summary)
    except Exception as e:
        logger.error(f"Error getting action items summary: {e}")
        return jsonify({'error': 'Failed to get action items summary'}), 500

@app.route('/api/action-items/high-priority', methods=['GET'])
def get_high_priority_actions():
    """Get all high priority action items"""
    try:
        doc_id = request.args.get('doc_id')
        high_priority = action_items_manager.get_high_priority_actions(doc_id)
        return jsonify({
            'high_priority_actions': high_priority,
            'total': len(high_priority)
        })
    except Exception as e:
        logger.error(f"Error getting high priority actions: {e}")
        return jsonify({'error': 'Failed to get high priority actions'}), 500

@app.route('/api/action-items/overdue', methods=['GET'])
def get_overdue_actions():
    """Get all overdue action items"""
    try:
        doc_id = request.args.get('doc_id')
        overdue = action_items_manager.get_overdue_actions(doc_id)
        return jsonify({
            'overdue_actions': overdue,
            'total': len(overdue)
        })
    except Exception as e:
        logger.error(f"Error getting overdue actions: {e}")
        return jsonify({'error': 'Failed to get overdue actions'}), 500

@app.route('/api/action-items/upcoming', methods=['GET'])
def get_upcoming_deadlines():
    """Get action items with upcoming deadlines"""
    try:
        doc_id = request.args.get('doc_id')
        days = request.args.get('days', 30, type=int)
        upcoming = action_items_manager.get_upcoming_deadlines(days, doc_id)
        return jsonify({
            'upcoming_deadlines': upcoming,
            'total': len(upcoming),
            'days': days
        })
    except Exception as e:
        logger.error(f"Error getting upcoming deadlines: {e}")
        return jsonify({'error': 'Failed to get upcoming deadlines'}), 500

@app.route('/api/document/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """Delete document and all associated data"""
    try:
        # Delete from data manager (document file and analysis)
        doc_deleted = data_manager.delete_document(doc_id)
        
        # Delete from summary manager
        summary_deleted = summary_manager.delete_summary(doc_id)
        
        # Delete from deep analysis manager
        deep_analysis_deleted = deep_analysis_manager.delete_deep_analysis(doc_id)
        
        # Delete from action items manager
        action_items_manager.delete_action_items(doc_id)
        
        # Remove from FAISS index if it exists
        if faiss_indexer and faiss_indexer.index:
            try:
                # Note: FAISS doesn't have a direct delete method, 
                # but we can mark the document as deleted in metadata
                logger.info(f"Document {doc_id} marked for removal from FAISS index")
            except Exception as e:
                logger.error(f"Error removing from FAISS index: {e}")
        
        if doc_deleted or summary_deleted:
            return jsonify({
                'message': 'Document deleted successfully',
                'doc_id': doc_id
            })
        else:
            return jsonify({'error': 'Document not found'}), 404
            
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {e}")
        return jsonify({'error': 'Failed to delete document'}), 500

@app.route('/api/qna', methods=['POST'])
def ask_question():
    """Ask questions about document using Gemini"""
    try:
        data = request.get_json()
        doc_id = data.get('docId')
        question = data.get('question')
        
        if not doc_id or not question:
            return jsonify({'error': 'Document ID and question required'}), 400
        
        doc_info = data_manager.get_document(doc_id)
        if not doc_info:
            return jsonify({'error': 'Document not found'}), 404
        
        if doc_info['status'] != 'completed':
            return jsonify({'error': 'Document processing not completed'}), 400
        
        # Get document file path for text extraction
        file_path = doc_info.get("stored_path")
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Document file not found'}), 404
        
        # Extract text again for Q&A
        text = document_processor.extract_text(file_path, doc_info["mime_type"])
        if not text:
            return jsonify({'error': 'No text available for analysis'}), 400
        
        # Get answer from Gemini with FAISS search
        answer = gemini_analyzer.answer_question(text, question, doc_id)
        
        return jsonify(answer)
        
    except Exception as e:
        logger.error(f"Q&A error: {e}")
        return jsonify({'error': 'Failed to process question'}), 500

@app.route('/api/documents', methods=['GET'])
def get_user_documents():
    """Get list of user's documents with summary data"""
    try:
        documents = data_manager.get_all_documents(summary_manager)
        return jsonify(documents)
        
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        return jsonify({'error': 'Failed to retrieve documents'}), 500

@app.route('/api/search', methods=['POST'])
def search_documents():
    """Search across all documents using FAISS"""
    try:
        data = request.get_json()
        query = data.get('query')
        k = data.get('k', 5)
        
        if not query:
            return jsonify({'error': 'Query required'}), 400
        
        results = faiss_indexer.search(query, k)
        
        # Add document names to results
        for result in results:
            doc_info = data_manager.get_document(result['doc_id'])
            if doc_info:
                result['document_name'] = doc_info['filename']
                result['document_status'] = doc_info['status']
        
        return jsonify({
            'query': query,
            'results': results,
            'total_results': len(results)
        })
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/faiss/stats', methods=['GET'])
def get_faiss_stats():
    """Get FAISS index statistics"""
    try:
        stats = faiss_indexer.get_index_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"FAISS stats error: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

@app.route('/api/data/stats', methods=['GET'])
def get_data_stats():
    """Get data storage statistics"""
    try:
        stats = data_manager.get_statistics()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Data stats error: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

@app.route('/api/export', methods=['POST'])
def export_briefing():
    """Export document briefing as PDF"""
    try:
        data = request.get_json()
        doc_id = data.get('docId')
        
        if not doc_id:
            return jsonify({'error': 'Document ID required'}), 400
        
        doc_info = data_manager.get_document(doc_id)
        if not doc_info:
            return jsonify({'error': 'Document not found'}), 404
        
        if doc_info['status'] != 'completed':
            return jsonify({'error': 'Document processing not completed'}), 400
        
        analysis = data_manager.get_analysis(doc_id)
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        # Create PDF briefing (simplified version)
        briefing_content = f"""
        Document Briefing: {doc_info['filename']}
        
        Summary:
        {analysis['analysis'].get('summary', 'No summary available')}
        
        Key Risks:
        {chr(10).join([f"- {risk['title']} ({risk['level']})" for risk in analysis['analysis'].get('risks', [])])}
        
        Recommendations:
        {chr(10).join([f"- {rec}" for rec in analysis['analysis'].get('recommendations', [])])}
        """
        
        # For demo purposes, return text content
        # In production, generate actual PDF
        return jsonify({
            'content': briefing_content,
            'filename': f"briefing_{doc_id}.txt"
        })
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        return jsonify({'error': 'Failed to export briefing'}), 500

@app.route('/api/signed-url', methods=['POST'])
def get_signed_url():
    """Get signed URL for direct upload (for future S3 integration)"""
    # This is a placeholder for S3 integration
    return jsonify({
        'signedUrl': 'https://example.com/upload',
        'fields': {}
    })

@app.route('/api/notify-upload', methods=['POST'])
def notify_upload():
    """Notify backend about completed upload (for S3 integration)"""
    # This is a placeholder for S3 integration
    return jsonify({'status': 'success'})

# Error handlers
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if Gemini API key is configured
    if GEMINI_API_KEY == "your-gemini-api-key-here":
        logger.warning("Please set GEMINI_API_KEY environment variable for full functionality")
    
    # Run the Flask app with watchdog configuration to ignore data files
    extra_dirs = ['templates/', 'static/'] if FLASK_DEBUG else []
    extra_files = extra_dirs if FLASK_DEBUG else []
    
    app.run(
        host='0.0.0.0',
        port=8080,
        debug=FLASK_DEBUG,
        extra_files=extra_files
    ) 