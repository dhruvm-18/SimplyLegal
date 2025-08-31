"""
Summary Manager for handling document summaries in plain language
Stores and retrieves simplified summaries from a dedicated JSON file
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SummaryManager:
    """Manages document summaries in plain language"""
    
    def __init__(self, summaries_file: str = "summaries.json"):
        self.summaries_file = Path(summaries_file)
        self.summaries = self._load_summaries()
    
    def _load_summaries(self) -> Dict[str, Any]:
        """Load summaries from JSON file"""
        try:
            if self.summaries_file.exists():
                with open(self.summaries_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading summaries: {e}")
        return {}
    
    def _save_summaries(self):
        """Save summaries to JSON file"""
        try:
            logger.info(f"Saving summaries to {self.summaries_file}")
            logger.info(f"Total summaries to save: {len(self.summaries)}")
            
            with open(self.summaries_file, 'w', encoding='utf-8') as f:
                json.dump(self.summaries, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"Summaries successfully saved to {self.summaries_file}")
        except Exception as e:
            logger.error(f"Error saving summaries: {e}")
            logger.error(f"Summaries file path: {self.summaries_file}")
            logger.error(f"Current working directory: {os.getcwd()}")
    
    def save_summary(self, doc_id: str, summary_data: Dict[str, Any]) -> bool:
        """Save document summary"""
        try:
            logger.info(f"Saving summary for document {doc_id}")
            logger.info(f"Summary data: {summary_data}")
            
            self.summaries[doc_id] = {
                "doc_id": doc_id,
                "summary": summary_data.get("summary", ""),
                "document_type": summary_data.get("document_type", ""),
                "parties_involved": summary_data.get("parties_involved", []),
                "key_terms": summary_data.get("key_terms", []),
                "main_points": summary_data.get("main_points", []),
                "overall_risk_level": summary_data.get("overall_risk_level", "unknown"),
                "risk_assessment": summary_data.get("risk_assessment", {
                    "primary_risks": [],
                    "risk_factors": [],
                    "recommendations": []
                }),
                "deep_analysis_data": summary_data.get("deep_analysis", {}),
                "created_at": datetime.now().isoformat(),
                "ai_generated": summary_data.get("ai_generated", True)
            }
            
            logger.info(f"Summary object created: {self.summaries[doc_id]}")
            
            self._save_summaries()
            logger.info(f"Summary saved to file for document {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving summary for {doc_id}: {e}")
            return False
    
    def get_summary(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document summary"""
        return self.summaries.get(doc_id)
    
    def get_all_summaries(self) -> List[Dict[str, Any]]:
        """Get all summaries"""
        return list(self.summaries.values())
    
    def delete_summary(self, doc_id: str) -> bool:
        """Delete document summary"""
        try:
            if doc_id in self.summaries:
                del self.summaries[doc_id]
                self._save_summaries()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting summary for {doc_id}: {e}")
            return False
    
    def update_summary(self, doc_id: str, summary_data: Dict[str, Any]) -> bool:
        """Update existing summary"""
        try:
            if doc_id in self.summaries:
                self.summaries[doc_id].update(summary_data)
                self.summaries[doc_id]["updated_at"] = datetime.now().isoformat()
                self._save_summaries()
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating summary for {doc_id}: {e}")
            return False 