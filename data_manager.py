"""
Data Manager for JSON-based document storage and persistence
Handles saving and loading documents, analysis results, and metadata
"""

import json
import os
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DataManager:
    """Manages document storage and analysis data persistence using JSON files"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.documents_file = self.data_dir / "documents.json"
        self.analysis_file = self.data_dir / "analysis.json"
        self.metadata_file = self.data_dir / "metadata.json"
        self.documents_storage = self.data_dir / "documents"
        
        # Create directories if they don't exist
        self._ensure_directories()
        
        # Initialize data structures
        self.documents = self._load_json(self.documents_file, {})
        self.analysis = self._load_json(self.analysis_file, {})
        self.metadata = self._load_json(self.metadata_file, {
            "total_documents": 0,
            "last_updated": None,
            "version": "1.0"
        })
    
    def _ensure_directories(self):
        """Create necessary directories"""
        self.data_dir.mkdir(exist_ok=True)
        self.documents_storage.mkdir(exist_ok=True)
    
    def _load_json(self, file_path: Path, default: Any) -> Any:
        """Load JSON file with error handling"""
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
        return default
    
    def _save_json(self, file_path: Path, data: Any):
        """Save data to JSON file with error handling"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            logger.info(f"Saved data to {file_path}")
        except Exception as e:
            logger.error(f"Error saving to {file_path}: {e}")
    
    def save_document(self, doc_id: str, file_path: str, filename: str, mime_type: str, metadata: Dict[str, Any] = None) -> bool:
        """Save document file and metadata with optional customization data"""
        try:
            # Copy document to storage
            source_path = Path(file_path)
            dest_path = self.documents_storage / f"{doc_id}_{filename}"
            
            if source_path.exists():
                shutil.copy2(source_path, dest_path)
                
                # Prepare document metadata
                doc_metadata = {
                    "id": doc_id,
                    "filename": filename,
                    "original_path": str(source_path),
                    "stored_path": str(dest_path),
                    "mime_type": mime_type,
                    "uploaded_at": datetime.now().isoformat(),
                    "file_size": dest_path.stat().st_size,
                    "status": "uploaded"
                }
                
                # Add customization metadata if provided
                if metadata:
                    logger.info(f"Saving customization metadata for {doc_id}: {metadata}")
                    doc_metadata.update({
                        "custom_name": metadata.get('custom_name', filename),
                        "theme": metadata.get('theme', 'default'),
                        "font": metadata.get('font', 'inter'),
                        "logo_path": metadata.get('logo_path'),
                        "customization": metadata
                    })
                else:
                    logger.info(f"No customization metadata for {doc_id}")
                
                self.documents[doc_id] = doc_metadata
                
                self._save_json(self.documents_file, self.documents)
                self._update_metadata()
                return True
            else:
                logger.error(f"Source file not found: {source_path}")
                return False
                
        except Exception as e:
            logger.error(f"Error saving document {doc_id}: {e}")
            return False
    
    def save_analysis(self, doc_id: str, analysis_data: Dict[str, Any]) -> bool:
        """Save document analysis results"""
        try:
            self.analysis[doc_id] = {
                "doc_id": doc_id,
                "analysis": analysis_data,
                "analyzed_at": datetime.now().isoformat(),
                "version": "1.0"
            }
            
            # Update document status
            if doc_id in self.documents:
                self.documents[doc_id]["status"] = "completed"
                self.documents[doc_id]["analyzed_at"] = datetime.now().isoformat()
            
            self._save_json(self.analysis_file, self.analysis)
            self._save_json(self.documents_file, self.documents)
            self._update_metadata()
            return True
            
        except Exception as e:
            logger.error(f"Error saving analysis for {doc_id}: {e}")
            return False
    
    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document metadata"""
        return self.documents.get(doc_id)
    
    def get_analysis(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document analysis"""
        return self.analysis.get(doc_id)
    
    def get_document_path(self, doc_id: str) -> Optional[str]:
        """Get the stored path of a document"""
        doc = self.documents.get(doc_id)
        return doc.get("stored_path") if doc else None
    
    def get_all_documents(self, summary_manager=None) -> List[Dict[str, Any]]:
        """Get all documents with their analysis and summary data"""
        documents = []
        for doc_id, doc_data in self.documents.items():
            analysis = self.analysis.get(doc_id, {})
            
            # Get summary from summary manager if available
            summary_data = None
            if summary_manager:
                try:
                    summary_data = summary_manager.get_summary(doc_id)
                except Exception as e:
                    logger.warning(f"Could not get summary for {doc_id}: {e}")
            
            # Use summary from summary manager, fallback to analysis summary
            summary_text = "No summary available"
            risk_level = "unknown"
            
            if summary_data and summary_data.get("summary"):
                summary_text = summary_data.get("summary", "No summary available")
                # Get risk level from summary data if available
                if summary_data.get("overall_risk_level"):
                    risk_level = summary_data.get("overall_risk_level")
                elif summary_data.get("risk_assessment", {}).get("overall_risk_level"):
                    risk_level = summary_data.get("risk_assessment", {}).get("overall_risk_level")
            else:
                # Fallback to analysis data
                summary_text = analysis.get("analysis", {}).get("summary", "No summary available")
                risk_level = self._get_overall_risk_level(analysis.get("analysis", {}))
            
            # Get customization data
            customization = doc_data.get("customization", {})
            custom_name = doc_data.get("custom_name", doc_data["filename"])
            
            documents.append({
                "id": doc_id,
                "name": custom_name,  # Use custom name if available
                "status": doc_data["status"],
                "uploadedAt": doc_data["uploaded_at"],
                "summary": summary_text,
                "riskLevel": risk_level,
                "analysis": analysis.get("analysis"),
                "summaryData": summary_data,  # Include full summary data for frontend
                "customization": customization,  # Include customization data
                "custom_name": custom_name,  # Include custom name
                "theme": doc_data.get("theme", "default"),
                "font": doc_data.get("font", "inter"),
                "logo_path": doc_data.get("logo_path")
            })
        
        # Sort by upload date (newest first)
        documents.sort(key=lambda x: x["uploadedAt"], reverse=True)
        return documents
    
    def update_document_status(self, doc_id: str, status: str, message: str = None) -> bool:
        """Update document processing status"""
        try:
            if doc_id in self.documents:
                self.documents[doc_id]["status"] = status
                if message:
                    self.documents[doc_id]["status_message"] = message
                self.documents[doc_id]["updated_at"] = datetime.now().isoformat()
                
                self._save_json(self.documents_file, self.documents)
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating status for {doc_id}: {e}")
            return False
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete document and its analysis"""
        try:
            # Remove document file
            doc = self.documents.get(doc_id)
            if doc and "stored_path" in doc:
                doc_path = Path(doc["stored_path"])
                if doc_path.exists():
                    doc_path.unlink()
            
            # Remove from data structures
            if doc_id in self.documents:
                del self.documents[doc_id]
            if doc_id in self.analysis:
                del self.analysis[doc_id]
            
            # Save updated data
            self._save_json(self.documents_file, self.documents)
            self._save_json(self.analysis_file, self.analysis)
            self._update_metadata()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {e}")
            return False
    
    def search_documents(self, query: str) -> List[Dict[str, Any]]:
        """Search documents by filename or content"""
        results = []
        query_lower = query.lower()
        
        for doc_id, doc_data in self.documents.items():
            # Search in filename
            if query_lower in doc_data["filename"].lower():
                results.append(doc_data)
                continue
            
            # Search in analysis content
            analysis = self.analysis.get(doc_id, {})
            if analysis:
                analysis_text = json.dumps(analysis, default=str).lower()
                if query_lower in analysis_text:
                    results.append(doc_data)
        
        return results
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get storage statistics"""
        total_size = 0
        for doc in self.documents.values():
            if "stored_path" in doc:
                doc_path = Path(doc["stored_path"])
                if doc_path.exists():
                    total_size += doc_path.stat().st_size
        
        return {
            "total_documents": len(self.documents),
            "analyzed_documents": len(self.analysis),
            "total_storage_size": total_size,
            "storage_size_mb": round(total_size / (1024 * 1024), 2),
            "last_updated": self.metadata.get("last_updated"),
            "data_directory": str(self.data_dir)
        }
    
    def backup_data(self, backup_dir: str = "backup") -> bool:
        """Create a backup of all data"""
        try:
            backup_path = Path(backup_dir)
            backup_path.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"backup_{timestamp}"
            backup_full_path = backup_path / backup_name
            backup_full_path.mkdir(exist_ok=True)
            
            # Copy all data files
            shutil.copy2(self.documents_file, backup_full_path / "documents.json")
            shutil.copy2(self.analysis_file, backup_full_path / "analysis.json")
            shutil.copy2(self.metadata_file, backup_full_path / "metadata.json")
            
            # Copy documents directory
            if self.documents_storage.exists():
                shutil.copytree(self.documents_storage, backup_full_path / "documents")
            
            logger.info(f"Backup created at {backup_full_path}")
            return True
        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            return False
    
    def _get_overall_risk_level(self, analysis: Dict[str, Any]) -> str:
        """Get overall risk level from analysis"""
        if not analysis or 'risks' not in analysis:
            return 'unknown'
        
        risk_levels = [risk.get('level', 'low') for risk in analysis['risks']]
        
        if 'high' in risk_levels:
            return 'high'
        elif 'medium' in risk_levels:
            return 'medium'
        else:
            return 'low'
    
    def _update_metadata(self):
        """Update metadata with current statistics"""
        self.metadata.update({
            "total_documents": len(self.documents),
            "last_updated": datetime.now().isoformat()
        })
        self._save_json(self.metadata_file, self.metadata)
    
    def cleanup_orphaned_files(self) -> int:
        """Remove orphaned files that don't have corresponding metadata"""
        cleaned = 0
        try:
            for file_path in self.documents_storage.iterdir():
                if file_path.is_file():
                    # Extract doc_id from filename
                    filename = file_path.name
                    doc_id = filename.split('_')[0] if '_' in filename else None
                    
                    if doc_id and doc_id not in self.documents:
                        file_path.unlink()
                        cleaned += 1
                        logger.info(f"Cleaned up orphaned file: {filename}")
            
            return cleaned
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return cleaned 