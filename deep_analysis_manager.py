"""
Deep Analysis Manager for handling detailed document analysis
Stores and retrieves comprehensive analysis data in a dedicated JSON file
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DeepAnalysisManager:
    """Manages detailed document analysis data"""
    
    def __init__(self, deep_analysis_file: str = "deep_analysis.json"):
        self.deep_analysis_file = Path(deep_analysis_file)
        self.deep_analysis_data = self._load_deep_analysis()
    
    def _load_deep_analysis(self) -> Dict[str, Any]:
        """Load deep analysis data from file"""
        try:
            if self.deep_analysis_file.exists():
                with open(self.deep_analysis_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logger.info(f"Loaded deep analysis data for {len(data)} documents")
                    return data
            else:
                logger.info("Deep analysis file not found, creating new one")
                return {}
        except Exception as e:
            logger.error(f"Error loading deep analysis data: {e}")
            return {}
    
    def _save_deep_analysis(self):
        """Save deep analysis data to file"""
        try:
            with open(self.deep_analysis_file, 'w', encoding='utf-8') as f:
                json.dump(self.deep_analysis_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved deep analysis data for {len(self.deep_analysis_data)} documents")
        except Exception as e:
            logger.error(f"Error saving deep analysis data: {e}")
    
    def save_deep_analysis(self, doc_id: str, analysis_data: Dict[str, Any]) -> bool:
        """Save deep analysis for a document"""
        try:
            logger.info(f"Saving deep analysis for document {doc_id}")
            
            # Extract the deep_analysis section from the response
            deep_analysis = analysis_data.get("deep_analysis", {})
            
            self.deep_analysis_data[doc_id] = {
                "doc_id": doc_id,
                "deep_analysis": deep_analysis,
                "created_at": datetime.now().isoformat(),
                "ai_generated": analysis_data.get("ai_generated", True),
                "model_used": analysis_data.get("model_used", "gemini-2.5-flash")
            }
            
            self._save_deep_analysis()
            logger.info(f"Successfully saved deep analysis for document {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving deep analysis for document {doc_id}: {e}")
            return False
    
    def get_deep_analysis(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get deep analysis for a document"""
        try:
            return self.deep_analysis_data.get(doc_id)
        except Exception as e:
            logger.error(f"Error getting deep analysis for document {doc_id}: {e}")
            return None
    
    def get_all_deep_analysis(self) -> List[Dict[str, Any]]:
        """Get all deep analysis data"""
        try:
            return list(self.deep_analysis_data.values())
        except Exception as e:
            logger.error(f"Error getting all deep analysis data: {e}")
            return []
    
    def delete_deep_analysis(self, doc_id: str) -> bool:
        """Delete deep analysis for a document"""
        try:
            if doc_id in self.deep_analysis_data:
                del self.deep_analysis_data[doc_id]
                self._save_deep_analysis()
                logger.info(f"Deleted deep analysis for document {doc_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting deep analysis for document {doc_id}: {e}")
            return False
    
    def update_deep_analysis(self, doc_id: str, analysis_data: Dict[str, Any]) -> bool:
        """Update deep analysis for a document"""
        try:
            logger.info(f"Updating deep analysis for document {doc_id}")
            
            # Extract the deep_analysis section from the response
            deep_analysis = analysis_data.get("deep_analysis", {})
            
            if doc_id in self.deep_analysis_data:
                self.deep_analysis_data[doc_id].update({
                    "deep_analysis": deep_analysis,
                    "updated_at": datetime.now().isoformat(),
                    "ai_generated": analysis_data.get("ai_generated", True),
                    "model_used": analysis_data.get("model_used", "gemini-2.5-flash")
                })
            else:
                self.deep_analysis_data[doc_id] = {
                    "doc_id": doc_id,
                    "deep_analysis": deep_analysis,
                    "created_at": datetime.now().isoformat(),
                    "ai_generated": analysis_data.get("ai_generated", True),
                    "model_used": analysis_data.get("model_used", "gemini-2.5-flash")
                }
            
            self._save_deep_analysis()
            logger.info(f"Successfully updated deep analysis for document {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating deep analysis for document {doc_id}: {e}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about deep analysis data"""
        try:
            total_documents = len(self.deep_analysis_data)
            ai_generated = sum(1 for doc in self.deep_analysis_data.values() if doc.get("ai_generated", False))
            
            return {
                "total_documents": total_documents,
                "ai_generated": ai_generated,
                "file_exists": self.deep_analysis_file.exists(),
                "file_size": self.deep_analysis_file.stat().st_size if self.deep_analysis_file.exists() else 0
            }
        except Exception as e:
            logger.error(f"Error getting deep analysis statistics: {e}")
            return {
                "total_documents": 0,
                "ai_generated": 0,
                "file_exists": False,
                "file_size": 0
            } 