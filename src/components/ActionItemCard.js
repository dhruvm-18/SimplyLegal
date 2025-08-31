import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiEdit3, FiMessageSquare, FiCalendar, FiUser, FiFileText, FiShield, FiUsers, FiTarget } from 'react-icons/fi';
import Card from './Card';
import './ActionItemCard.css';

const ActionItemCard = ({ item, onStatusUpdate, onAddNote }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FiAlertTriangle size={16} className="priority-icon high" />;
      case 'medium':
        return <FiClock size={16} className="priority-icon medium" />;
      case 'low':
        return <FiCheckCircle size={16} className="priority-icon low" />;
      default:
        return <FiClock size={16} className="priority-icon medium" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'legal_consultation':
        return <FiShield size={16} />;
      case 'negotiation':
        return <FiUsers size={16} />;
      case 'compliance':
        return <FiAlertTriangle size={16} />;
      case 'risk_mitigation':
        return <FiTarget size={16} />;
      case 'documentation':
        return <FiFileText size={16} />;
      default:
        return <FiFileText size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      case 'pending':
        return 'pending';
      case 'overdue':
        return 'overdue';
      default:
        return 'pending';
    }
  };

  const handleStatusChange = (newStatus) => {
    const completed = newStatus === 'completed';
    onStatusUpdate(item.id, newStatus, completed);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      await onAddNote(item.id, newNote.trim());
      setNewNote('');
      setShowNotes(false);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else if (diffDays <= 7) {
        return `Due in ${diffDays} days`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return dateString;
    }
  };

  return (
    <motion.div
      className={`action-item-card ${getStatusColor(item.status)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="action-content">
        <div className="action-header">
          <div className="action-priority">
            {getPriorityIcon(item.priority)}
            <span className={`priority-badge ${item.priority}`}>
              {item.priority.toUpperCase()}
            </span>
          </div>
          
          <div className="action-category">
            {getCategoryIcon(item.category)}
            <span className="category-label">{item.category}</span>
          </div>
        </div>

        <div className="action-body">
          <h4 className="action-title">{item.task}</h4>
          
          {item.description && (
            <p className="action-description">{item.description}</p>
          )}

          <div className="action-details">
            {item.due_date && (
              <div className="detail-item">
                <FiCalendar size={14} />
                <span className={`due-date ${item.due_date && new Date(item.due_date) < new Date() ? 'overdue' : ''}`}>
                  {formatDate(item.due_date)}
                </span>
              </div>
            )}
            
            {item.responsible_party && (
              <div className="detail-item">
                <FiUser size={14} />
                <span>{item.responsible_party}</span>
              </div>
            )}
            
            {item.source_section && (
              <div className="detail-item">
                <FiFileText size={14} />
                <span>{item.source_section}</span>
              </div>
            )}
          </div>

          {item.risk_reduction_impact && (
            <div className="action-risk-impact">
              <strong>Risk Reduction Impact:</strong>
              <p>{item.risk_reduction_impact}</p>
            </div>
          )}

          {item.legal_basis && (
            <div className="action-legal-basis">
              <strong>Legal Basis:</strong>
              <p>{item.legal_basis}</p>
            </div>
          )}

          {item.negotiation_leverage && (
            <div className="action-negotiation">
              <strong>Negotiation Leverage:</strong>
              <p>{item.negotiation_leverage}</p>
            </div>
          )}

          {item.consequences && (
            <div className="action-consequences">
              <strong>Risks if not addressed:</strong>
              <p>{item.consequences}</p>
            </div>
          )}

          {item.notes && (
            <div className="action-notes">
              <strong>Strategic Considerations:</strong>
              <p>{item.notes}</p>
            </div>
          )}
        </div>

        <div className="action-footer">
          <div className="action-status">
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`status-select ${getStatusColor(item.status)}`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="action-actions">
            <button
              className="action-btn note-btn"
              onClick={() => setShowNotes(!showNotes)}
              title="Add note"
            >
              <FiEdit3 size={16} />
            </button>
          </div>
        </div>

        {showNotes && (
          <motion.div
            className="note-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="note-input">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this action item..."
                rows={3}
              />
              <div className="note-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowNotes(false)}
                  disabled={isAddingNote}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                >
                  {isAddingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default ActionItemCard; 