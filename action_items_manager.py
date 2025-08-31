"""
Action Items Manager for SimplyLegal
Handles extraction and management of actionable items from legal documents
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import google.generativeai as genai
from config import GEMINI_API_KEY
from prompts import ACTION_ITEMS_PROMPT

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)

class ActionItemsManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.action_items_file = os.path.join(data_dir, "action_items.json")
        self._ensure_data_dir()
        self._load_action_items()
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def _load_action_items(self):
        """Load existing action items from JSON file"""
        if os.path.exists(self.action_items_file):
            try:
                with open(self.action_items_file, 'r', encoding='utf-8') as f:
                    self.action_items = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.action_items = {}
        else:
            self.action_items = {}
    
    def _save_action_items(self):
        """Save action items to JSON file"""
        with open(self.action_items_file, 'w', encoding='utf-8') as f:
            json.dump(self.action_items, f, indent=2, ensure_ascii=False)
    
    def extract_action_items(self, doc_id: str, filename: str, text: str) -> Dict[str, Any]:
        """
        Extract action items from document text using Gemini AI
        
        Args:
            doc_id: Unique document identifier
            filename: Original filename
            text: Document text content
            
        Returns:
            Dictionary containing extracted action items
        """
        try:
            # Prepare the prompt with document content
            prompt = ACTION_ITEMS_PROMPT.format(
                filename=filename,
                text=text,
                timestamp=datetime.now().isoformat()
            )
            
            # Generate response using Gemini AI
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            
            # Parse the JSON response
            try:
                # Clean the response text - remove any markdown formatting
                clean_response = response.text.strip()
                
                # Remove markdown code blocks if present
                if clean_response.startswith('```json'):
                    clean_response = clean_response[7:]
                if clean_response.endswith('```'):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                print(f"Cleaned response: {clean_response[:200]}...")
                
                action_items_data = json.loads(clean_response)
                
                # Validate that we have action items
                if not action_items_data.get('action_items') or len(action_items_data.get('action_items', [])) == 0:
                    print("Warning: No action items found in response, creating fallback")
                    return self._create_fallback_action_items(doc_id, filename)
                
                # Add metadata
                action_items_data['doc_id'] = doc_id
                action_items_data['filename'] = filename
                action_items_data['extracted_at'] = datetime.now().isoformat()
                
                print(f"Successfully extracted {len(action_items_data.get('action_items', []))} action items")
                
                # Save to file
                self.action_items[doc_id] = action_items_data
                self._save_action_items()
                
                return action_items_data
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {e}")
                print(f"Raw response: {response.text}")
                print(f"Cleaned response: {clean_response}")
                
                # Try to extract JSON from the response if it contains other text
                try:
                    import re
                    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                    if json_match:
                        extracted_json = json_match.group(0)
                        print(f"Attempting to extract JSON: {extracted_json[:200]}...")
                        action_items_data = json.loads(extracted_json)
                        
                        # Validate that we have action items
                        if not action_items_data.get('action_items') or len(action_items_data.get('action_items', [])) == 0:
                            print("Warning: No action items found in extracted JSON, creating fallback")
                            return self._create_fallback_action_items(doc_id, filename)
                        
                        # Add metadata
                        action_items_data['doc_id'] = doc_id
                        action_items_data['filename'] = filename
                        action_items_data['extracted_at'] = datetime.now().isoformat()
                        
                        print(f"Successfully extracted {len(action_items_data.get('action_items', []))} action items from extracted JSON")
                        
                        # Save to file
                        self.action_items[doc_id] = action_items_data
                        self._save_action_items()
                        
                        return action_items_data
                except Exception as extract_error:
                    print(f"JSON extraction also failed: {extract_error}")
                
                return self._create_fallback_action_items(doc_id, filename)
                
        except Exception as e:
            print(f"Error extracting action items: {e}")
            return self._create_fallback_action_items(doc_id, filename)
    
    def _create_fallback_action_items(self, doc_id: str, filename: str) -> Dict[str, Any]:
        """Create fallback action items when AI extraction fails"""
        fallback_data = {
            "doc_id": doc_id,
            "filename": filename,
            "action_items": [
                {
                    "id": "fallback-1",
                    "task": "Consult legal counsel for comprehensive document review",
                    "description": "Have an attorney review the entire document to identify legal risks, compliance issues, and opportunities for improvement",
                    "due_date": None,
                    "priority": "high",
                    "category": "legal_consultation",
                    "responsible_party": "Legal Team",
                    "source_section": "Entire document",
                    "status": "pending",
                    "completed": False,
                    "notes": "Standard recommendation for any legal document to ensure proper legal review",
                    "consequences": "Missing legal risks could lead to unfavorable terms, compliance violations, or unexpected liabilities",
                    "risk_reduction_impact": "Legal review will identify potential issues and suggest improvements",
                    "legal_basis": "Best practice for legal document review",
                    "negotiation_leverage": "Legal counsel can identify negotiation points and suggest improvements",
                    "dependencies": [],
                    "evidence": "General legal document review requirement"
                },
                {
                    "id": "fallback-2",
                    "task": "Negotiate more favorable terms where possible",
                    "description": "Identify clauses that could be improved through negotiation to better protect interests",
                    "due_date": None,
                    "priority": "medium",
                    "category": "negotiation",
                    "responsible_party": "Negotiator",
                    "source_section": "All contractual terms",
                    "status": "pending",
                    "completed": False,
                    "notes": "Most contracts have room for improvement through negotiation",
                    "consequences": "Accepting unfavorable terms without negotiation could lead to financial or operational risks",
                    "risk_reduction_impact": "Better terms reduce risk exposure and improve position",
                    "legal_basis": "Contract negotiation principles",
                    "negotiation_leverage": "Identify specific terms for discussion",
                    "dependencies": ["fallback-1"],
                    "evidence": "Standard negotiation practice for legal documents"
                },
                {
                    "id": "fallback-3",
                    "task": "Add dispute resolution clause if missing",
                    "description": "Ensure the document includes clear procedures for resolving disputes, preferably with mediation options",
                    "due_date": None,
                    "priority": "medium",
                    "category": "risk_mitigation",
                    "responsible_party": "Legal Team",
                    "source_section": "Dispute resolution section",
                    "status": "pending",
                    "completed": False,
                    "notes": "Dispute resolution clauses help avoid costly litigation",
                    "consequences": "Without clear dispute resolution, conflicts may escalate to expensive litigation",
                    "risk_reduction_impact": "Reduces litigation risk and provides clear conflict resolution path",
                    "legal_basis": "Contract law best practices",
                    "negotiation_leverage": "Can be used as a negotiation point for better terms",
                    "dependencies": ["fallback-1"],
                    "evidence": "Standard risk mitigation for legal documents"
                },
                {
                    "id": "fallback-4",
                    "task": "Review termination provisions for fairness",
                    "description": "Ensure termination clauses are balanced and provide adequate notice and protection",
                    "due_date": None,
                    "priority": "medium",
                    "category": "legal_consultation",
                    "responsible_party": "Legal Team",
                    "source_section": "Termination section",
                    "status": "pending",
                    "completed": False,
                    "notes": "Termination clauses often need review for fairness and compliance",
                    "consequences": "Unfair termination provisions could lead to legal disputes or regulatory issues",
                    "risk_reduction_impact": "Fair termination provisions reduce legal risk",
                    "legal_basis": "Contract fairness and compliance requirements",
                    "negotiation_leverage": "Can negotiate for more favorable termination terms",
                    "dependencies": ["fallback-1"],
                    "evidence": "Standard legal document review requirement"
                },
                {
                    "id": "fallback-5",
                    "task": "Document all verbal agreements in writing",
                    "description": "Ensure any verbal agreements or understandings related to this document are properly documented",
                    "due_date": None,
                    "priority": "low",
                    "category": "documentation",
                    "responsible_party": "Management",
                    "source_section": "Related agreements",
                    "status": "pending",
                    "completed": False,
                    "notes": "Verbal agreements should always be documented for legal protection",
                    "consequences": "Undocumented verbal agreements may not be enforceable and could lead to disputes",
                    "risk_reduction_impact": "Proper documentation provides legal protection and clarity",
                    "legal_basis": "Contract law requirements for enforceability",
                    "negotiation_leverage": "Documentation can clarify terms and prevent misunderstandings",
                    "dependencies": [],
                    "evidence": "Standard documentation best practice"
                }
            ],
            "summary": {
                "total_actions": 5,
                "high_priority": 1,
                "legal_consultation_needed": 2,
                "negotiation_points": 1,
                "compliance_issues": 0
            },
            "categories": {
                "legal_consultation": 2,
                "negotiation": 1,
                "compliance": 0,
                "risk_mitigation": 1,
                "documentation": 1,
                "other": 0
            },
            "ai_generated": False,
            "analysis_timestamp": datetime.now().isoformat(),
            "model_used": "fallback-action-items",
            "error": "AI extraction failed, using standard legal document recommendations",
            "extracted_at": datetime.now().isoformat()
        }
        
        # Save fallback data
        self.action_items[doc_id] = fallback_data
        self._save_action_items()
        
        return fallback_data
    
    def get_action_items(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get action items for a specific document"""
        return self.action_items.get(doc_id)
    
    def get_all_action_items(self) -> Dict[str, Any]:
        """Get all action items"""
        return self.action_items
    
    def update_action_item_status(self, doc_id: str, action_id: str, status: str, completed: bool = False):
        """Update the status of a specific action item"""
        if doc_id in self.action_items:
            doc_actions = self.action_items[doc_id].get('action_items', [])
            for action in doc_actions:
                if action.get('id') == action_id:
                    action['status'] = status
                    action['completed'] = completed
                    action['updated_at'] = datetime.now().isoformat()
                    break
            
            self._save_action_items()
    
    def add_note_to_action_item(self, doc_id: str, action_id: str, note: str):
        """Add a note to a specific action item"""
        if doc_id in self.action_items:
            doc_actions = self.action_items[doc_id].get('action_items', [])
            for action in doc_actions:
                if action.get('id') == action_id:
                    if 'notes' not in action:
                        action['notes'] = ""
                    action['notes'] += f"\n{datetime.now().strftime('%Y-%m-%d %H:%M')}: {note}"
                    action['updated_at'] = datetime.now().isoformat()
                    break
            
            self._save_action_items()
    
    def get_high_priority_actions(self, doc_id: str = None) -> List[Dict[str, Any]]:
        """Get all high priority actions, optionally filtered by document"""
        high_priority = []
        
        if doc_id:
            doc_actions = self.action_items.get(doc_id, {}).get('action_items', [])
            high_priority = [action for action in doc_actions if action.get('priority') == 'high']
        else:
            for doc_data in self.action_items.values():
                doc_actions = doc_data.get('action_items', [])
                high_priority.extend([action for action in doc_actions if action.get('priority') == 'high'])
        
        return high_priority
    
    def get_overdue_actions(self, doc_id: str = None) -> List[Dict[str, Any]]:
        """Get all overdue actions, optionally filtered by document"""
        overdue = []
        today = datetime.now().date()
        
        if doc_id:
            doc_actions = self.action_items.get(doc_id, {}).get('action_items', [])
            for action in doc_actions:
                due_date = action.get('due_date')
                if due_date and not action.get('completed', False):
                    try:
                        due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()
                        if due_date_obj < today:
                            overdue.append(action)
                    except ValueError:
                        continue
        else:
            for doc_data in self.action_items.values():
                doc_actions = doc_data.get('action_items', [])
                for action in doc_actions:
                    due_date = action.get('due_date')
                    if due_date and not action.get('completed', False):
                        try:
                            due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()
                            if due_date_obj < today:
                                overdue.append(action)
                        except ValueError:
                            continue
        
        return overdue
    
    def get_upcoming_deadlines(self, days: int = 30, doc_id: str = None) -> List[Dict[str, Any]]:
        """Get actions with upcoming deadlines within specified days"""
        upcoming = []
        today = datetime.now().date()
        future_date = today.replace(day=today.day + days)
        
        if doc_id:
            doc_actions = self.action_items.get(doc_id, {}).get('action_items', [])
            for action in doc_actions:
                due_date = action.get('due_date')
                if due_date and not action.get('completed', False):
                    try:
                        due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()
                        if today <= due_date_obj <= future_date:
                            upcoming.append(action)
                    except ValueError:
                        continue
        else:
            for doc_data in self.action_items.values():
                doc_actions = doc_data.get('action_items', [])
                for action in doc_actions:
                    due_date = action.get('due_date')
                    if due_date and not action.get('completed', False):
                        try:
                            due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()
                            if today <= due_date_obj <= future_date:
                                upcoming.append(action)
                        except ValueError:
                            continue
        
        return upcoming
    
    def delete_action_items(self, doc_id: str):
        """Delete action items for a specific document"""
        if doc_id in self.action_items:
            del self.action_items[doc_id]
            self._save_action_items()
    
    def get_action_items_summary(self) -> Dict[str, Any]:
        """Get a summary of all action items across all documents"""
        total_actions = 0
        total_high_priority = 0
        total_overdue = 0
        total_upcoming = 0
        total_completed = 0
        
        for doc_data in self.action_items.values():
            doc_actions = doc_data.get('action_items', [])
            total_actions += len(doc_actions)
            
            for action in doc_actions:
                if action.get('priority') == 'high':
                    total_high_priority += 1
                if action.get('completed', False):
                    total_completed += 1
        
        total_overdue = len(self.get_overdue_actions())
        total_upcoming = len(self.get_upcoming_deadlines())
        
        return {
            "total_documents": len(self.action_items),
            "total_actions": total_actions,
            "high_priority_actions": total_high_priority,
            "overdue_actions": total_overdue,
            "upcoming_deadlines": total_upcoming,
            "completed_actions": total_completed,
            "completion_rate": (total_completed / total_actions * 100) if total_actions > 0 else 0
        } 