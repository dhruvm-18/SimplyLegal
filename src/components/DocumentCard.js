import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { FiFile, FiClock, FiCheckCircle, FiAlertCircle, FiEye, FiTrash2, FiImage, FiDroplet, FiType, FiEdit3, FiX, FiSave } from 'react-icons/fi';
import './DocumentCard.css';

const DocumentCard = ({ document, onClick, onDelete, onOpenCustomization }) => {
  // Debug logging for summary data
  if (process.env.NODE_ENV === 'development') {
    console.log('DocumentCard data:', {
      id: document.id,
      name: document.name,
      status: document.status,
      summary: document.summary,
      riskLevel: document.riskLevel,
      hasSummaryData: !!document.summaryData
    });
  }
  const getStatusIcon = (status, summary) => {
    // Prioritize the actual status field over summary content
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="status-icon completed" />;
      case 'processing':
      case 'analyzing':
        return <FiClock className="status-icon processing" />;
      case 'failed':
      case 'error':
        return <FiAlertCircle className="status-icon failed" />;
      default:
        // Only check summary for error keywords if status is unclear
        if (summary && summary.toLowerCase().includes('failed') || summary && summary.toLowerCase().includes('error')) {
          return <FiAlertCircle className="status-icon failed" />;
        }
        return <FiClock className="status-icon" />;
    }
  };

  const getStatusColor = (status, summary) => {
    // Prioritize the actual status field over summary content
    switch (status) {
      case 'completed':
        return 'var(--secondary-color)';
      case 'processing':
      case 'analyzing':
        return 'var(--warning-color)';
      case 'failed':
      case 'error':
        return 'var(--error-color)';
      default:
        // Only check summary for error keywords if status is unclear
        if (summary && summary.toLowerCase().includes('failed') || summary && summary.toLowerCase().includes('error')) {
          return 'var(--error-color)';
        }
        return 'var(--text-tertiary)';
    }
  };

  const getStatusText = (status, summary) => {
    // Prioritize the actual status field over summary content
    switch (status) {
      case 'completed':
        return 'Analysis Complete';
      case 'processing':
        return 'Processing...';
      case 'analyzing':
        return 'Analyzing...';
      case 'failed':
      case 'error':
        return 'Analysis Failed';
      default:
        // Only check summary for error keywords if status is unclear
        if (summary && summary.toLowerCase().includes('failed') || summary && summary.toLowerCase().includes('error')) {
          return 'Analysis Failed';
        }
        return 'Unknown Status';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      y: -4,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // Get customization data
  const customization = document.customization || {};
  const customName = document.custom_name || document.name;
  const theme = document.theme || customization.theme || 'default';
  const font = document.font || customization.font || 'inter';
  const hasLogo = document.logo_path || customization.hasLogo || false;

  // Theme colors for card styling
  const themeColors = {
    default: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
    professional: { primary: '#1F2937', secondary: '#374151', accent: '#6B7280' },
    modern: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
    corporate: { primary: '#059669', secondary: '#047857', accent: '#10B981' },
    elegant: { primary: '#DC2626', secondary: '#B91C1C', accent: '#EF4444' }
  };

  const currentTheme = themeColors[theme] || themeColors.default;



  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card
        className="document-card"
        hoverable
        onClick={onClick}
        elevation="small"
        style={{
          '--theme-primary': currentTheme.primary,
          '--theme-secondary': currentTheme.secondary,
          '--theme-accent': currentTheme.accent
        }}
      >
        <div className="document-card-header">
          <div className="document-icon" style={{ color: currentTheme.primary }}>
            <FiFile />
          </div>
          <div className="document-actions">
            <div className="document-status">
              {getStatusIcon(document.status, document.summary)}
            </div>
            <button 
              className="customize-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCustomization) {
                  onOpenCustomization(document);
                }
              }}
              title="Customize document"
              aria-label={`Customize ${customName}`}
            >
              <FiEdit3 size={16} />
            </button>
            {onDelete && (
              <button 
                className="delete-btn"
                onClick={(e) => onDelete(document.id, e)}
                title="Delete document"
                aria-label={`Delete ${customName}`}
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="document-card-body">
          <h3 className="document-title">{customName}</h3>
          <p className={`document-summary ${document.status !== 'completed' && (document.summary?.toLowerCase().includes('failed') || document.summary?.toLowerCase().includes('error')) ? 'error-summary' : ''}`}>
            {document.summary}
          </p>
          
          <div className="document-meta">
            <span className="document-date">
              {formatDate(document.uploadedAt)}
            </span>
            <span 
              className="document-status-text"
              style={{ color: getStatusColor(document.status, document.summary) }}
            >
              {getStatusText(document.status, document.summary)}
            </span>
          </div>

          {document.riskLevel && document.riskLevel !== 'unknown' && document.status === 'completed' && (
            <div className="risk-indicator">
              <span className={`risk-badge risk-${document.riskLevel}`}>
                {document.riskLevel.toUpperCase()} Risk
              </span>
            </div>
          )}

          {/* Customization indicators */}
          {(theme !== 'default' || font !== 'inter' || hasLogo) && (
            <div className="customization-indicators">
              {theme !== 'default' && (
                <div className="customization-badge theme-badge">
                  <FiDroplet size={12} />
                  <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </div>
              )}
              {font !== 'inter' && (
                <div className="customization-badge font-badge">
                  <FiType size={12} />
                  <span>{font.charAt(0).toUpperCase() + font.slice(1)}</span>
                </div>
              )}
              {hasLogo && (
                <div className="customization-badge logo-badge">
                  <FiImage size={12} />
                  <span>Logo</span>
                </div>
              )}
            </div>
          )}
        </div>



        <div className="document-card-footer">
          <button 
            className="view-document-btn"
            style={{ 
              backgroundColor: currentTheme.primary,
              borderColor: currentTheme.primary 
            }}
          >
            <FiEye />
            <span>View Analysis</span>
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

export default DocumentCard; 