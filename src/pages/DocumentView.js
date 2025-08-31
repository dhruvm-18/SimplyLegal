import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiService } from '../lib/api';
import Button from '../components/Button';
import Card from '../components/Card';
import ActionItemCard from '../components/ActionItemCard';
import { FiArrowLeft, FiDownload, FiAlertTriangle, FiCheckCircle, FiShield, FiFileText, FiTrendingUp, FiClock, FiTarget, FiZap, FiBarChart, FiUsers, FiCalendar, FiDollarSign, FiMessageCircle, FiSend, FiUser, FiCpu, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType, Table, TableRow, TableCell, ImageRun, ExternalHyperlink, PageBreak, Spacing, ShadingType, Color } from 'docx';
import './DocumentView.css';

const DocumentView = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [qaMessages, setQaMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(null);

  const [actionItems, setActionItems] = useState(null);
  const indicatorRef = useRef(null);
  const navContainerRef = useRef(null);
  const navigationRef = useRef(null);
  const qaContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // iOS Navigation Liquid Animation
  useEffect(() => {
    const updateActiveIndicator = (animate = true) => {
      const indicator = indicatorRef.current;
      const activeItem = navContainerRef.current?.querySelector('.nav-item.active');
      
      if (indicator && activeItem && navContainerRef.current) {
        const containerRect = navContainerRef.current.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        
        const targetLeft = itemRect.left - containerRect.left;
        const targetWidth = itemRect.width;
        
        if (animate) {
          // Smooth animation with easing
          const startLeft = parseFloat(indicator.style.left) || 0;
          const startWidth = parseFloat(indicator.style.width) || 0;
          const startTime = performance.now();
          const duration = 400; // Animation duration in ms
          
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (cubic-bezier for smooth motion)
            const easeProgress = easeInOutCubic(progress);
            
            // Interpolate between start and target positions
            const currentLeft = startLeft + (targetLeft - startLeft) * easeProgress;
            const currentWidth = startWidth + (targetWidth - startWidth) * easeProgress;
            
            indicator.style.left = `${currentLeft}px`;
            indicator.style.width = `${currentWidth}px`;
            
            // Add subtle scale effect during animation
            const scale = 1 + Math.sin(progress * Math.PI) * 0.05;
            indicator.style.transform = `scaleY(${scale})`;
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              indicator.style.transform = '';
            }
          };
          
          requestAnimationFrame(animate);
        } else {
          // Instant positioning (for initial load and resize)
          indicator.style.left = `${targetLeft}px`;
          indicator.style.width = `${targetWidth}px`;
          indicator.style.transform = '';
        }
      }
    };

    // Smooth easing function
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      updateActiveIndicator(false); // No animation on initial load
    }, 100);

    // Add resize listener
    window.addEventListener('resize', () => updateActiveIndicator(false));
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', () => updateActiveIndicator(false));
    };
  }, [activeSection]);

  // Separate effect for smooth animations when activeSection changes
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (indicator && navContainerRef.current) {
      const activeItem = navContainerRef.current.querySelector('.nav-item.active');
      if (activeItem) {
        const containerRect = navContainerRef.current.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        
        const targetLeft = itemRect.left - containerRect.left;
        const targetWidth = itemRect.width;
        
        // Smooth animation with easing
        const startLeft = parseFloat(indicator.style.left) || 0;
        const startWidth = parseFloat(indicator.style.width) || 0;
        const startTime = performance.now();
        const duration = 400; // Animation duration in ms
        
        const easeInOutCubic = (t) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function (cubic-bezier for smooth motion)
          const easeProgress = easeInOutCubic(progress);
          
          // Interpolate between start and target positions
          const currentLeft = startLeft + (targetLeft - startLeft) * easeProgress;
          const currentWidth = startWidth + (targetWidth - startWidth) * easeProgress;
          
          indicator.style.left = `${currentLeft}px`;
          indicator.style.width = `${currentWidth}px`;
          
          // Add subtle scale effect during animation
          const scale = 1 + Math.sin(progress * Math.PI) * 0.05;
          indicator.style.transform = `scaleY(${scale})`;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            indicator.style.transform = '';
          }
        };
        
        requestAnimationFrame(animate);
      }
    }
  }, [activeSection]);

  // Drag functionality
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const navigation = navigationRef.current;
    if (!navigation) return;

    const handleMouseDown = (e) => {
      // Only allow dragging from the navigation container, not from buttons
      if (e.target.closest('.nav-item')) return;
      
      setIsDragging(true);
      const rect = navigation.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      navigation.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - navigation.offsetWidth;
      const maxY = window.innerHeight - navigation.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(x, maxX));
      const constrainedY = Math.max(0, Math.min(y, maxY));
      
      navigation.style.position = 'fixed';
      navigation.style.top = `${constrainedY}px`;
      navigation.style.left = `${constrainedX}px`;
      navigation.style.transform = 'none';
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (navigation) {
        navigation.style.cursor = 'grab';
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        if (navigation) {
          navigation.style.cursor = 'grab';
        }
      }
    };

    // Add event listeners only if navigation element exists
    if (navigation) {
      navigation.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      // Clean up event listeners only if they were added
      if (navigation) {
        navigation.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isDragging, dragOffset]);

  // Load document data
  useEffect(() => {
    console.log('DocumentView: Loading document with ID:', docId);
    
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use real API service
        const docData = await apiService.getDocumentDetails(docId);
        console.log('DocumentView: Loaded document data:', docData);
        
        if (!docData) {
          throw new Error('Document not found');
        }
        
        setDocument(docData);
        
        // Fetch deep analysis data
        try {
          const deepData = await apiService.getDeepAnalysis(docId);
          console.log('DocumentView: Loaded deep analysis data:', deepData);
          setDeepAnalysis(deepData);
        } catch (deepError) {
          console.warn('Deep analysis not available:', deepError);
          setDeepAnalysis(null);
        }
        

        
        // Fetch action items data
        try {
          const actionItemsData = await apiService.getActionItems(docId);
          console.log('DocumentView: Loaded action items data:', actionItemsData);
          setActionItems(actionItemsData);
        } catch (actionItemsError) {
          console.warn('Action items not available:', actionItemsError);
          setActionItems(null);
        }
      } catch (err) {
        console.error('DocumentView: Error loading document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [docId]);

  // Auto-scroll Q&A to bottom when new messages arrive
  useEffect(() => {
    if (qaContainerRef.current) {
      qaContainerRef.current.scrollTop = qaContainerRef.current.scrollHeight;
    }
  }, [qaMessages]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || isAskingQuestion) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setIsAskingQuestion(true);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    setQaMessages(prev => [...prev, userMessage]);

    try {
      // Get AI response using Gemini
      const response = await apiService.askQuestion(docId, question);
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer,
        citations: response.citations,
        confidence: response.confidence,
        timestamp: new Date()
      };
      setQaMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setQaMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setCurrentQuestion(question);
    // Automatically send the question after a short delay
    setTimeout(() => {
      handleAskQuestion();
    }, 100);
  };

  const handleActionItemStatusUpdate = async (actionId, status, completed) => {
    try {
      await apiService.updateActionItemStatus(docId, actionId, status, completed);
      
      // Update local state
      setActionItems(prev => ({
        ...prev,
        action_items: prev.action_items.map(item =>
          item.id === actionId
            ? { ...item, status, completed, updated_at: new Date().toISOString() }
            : item
        )
      }));
    } catch (error) {
      console.error('Error updating action item status:', error);
    }
  };

  const handleActionItemNoteAdd = async (actionId, note) => {
    try {
      await apiService.addActionItemNote(docId, actionId, note);
      
      // Update local state
      setActionItems(prev => ({
        ...prev,
        action_items: prev.action_items.map(item =>
          item.id === actionId
            ? { 
                ...item, 
                notes: item.notes ? `${item.notes}\n${new Date().toLocaleString()}: ${note}` : `${new Date().toLocaleString()}: ${note}`,
                updated_at: new Date().toISOString()
              }
            : item
        )
      }));
    } catch (error) {
      console.error('Error adding note to action item:', error);
    }
  };

  const handleExportWord = async () => {
    try {
      console.log('Generating Word document...');
      
      // Debug the data structure
      console.log('Document data for export:', document);
      console.log('Document risks:', document?.risks);
      console.log('Document checklist:', document?.checklist);
      console.log('Document clauses:', document?.clauses);
      console.log('Deep analysis data:', deepAnalysis);
      
      // Create HTML content that Word can open directly as a .doc file
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <title>SimplyLegal Report</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowRevisions/>
              <w:DoNotPrintRevisions/>
              <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
              <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
              <w:UseMarginsForDrawingGridOrigin/>
              <w:ValidateAgainstSchemas/>
              <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
              <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
              <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
              <w:Compatibility>
                <w:BreakWrappedTables/>
                <w:SnapToGridInCell/>
                <w:WrapTextWithPunct/>
                <w:UseAsianBreakRules/>
                <w:DontGrowAutofit/>
              </w:Compatibility>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; }
            h3 { color: #7f8c8d; margin-top: 20px; }
            .section { margin-bottom: 30px; }
            .stat { margin: 10px 0; }
            .risk-high { color: #e74c3c; font-weight: bold; }
            .risk-medium { color: #f39c12; font-weight: bold; }
            .risk-low { color: #27ae60; font-weight: bold; }
            .clause-item { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; background: #f8f9fa; }
            .action-item { margin: 10px 0; padding: 10px; background: #ecf0f1; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #bdc3c7; padding: 12px; text-align: left; }
            th { background-color: #ecf0f1; font-weight: bold; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <h1>SIMPLELEGAL REPORT</h1>
          
          <div class="section">
            <h2>Document Information</h2>
            <p><strong>Document Name:</strong> ${document?.name || 'Unknown Document'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div class="section">
            <h2>DOCUMENT OVERVIEW</h2>
            <p>${document?.summary || "No summary available."}</p>
            
            <h3>Key Statistics</h3>
            <div class="stat">• Total Clauses: ${document?.clauses?.length || 0}</div>
            <div class="stat">• Total Risks: ${document?.risks?.length || 0}</div>
            <div class="stat">• Action Items: ${document?.checklist?.length || 0}</div>
          </div>

          <div class="page-break"></div>
          
          <div class="section">
            <h2>DEEP ANALYSIS</h2>
            ${deepAnalysis?.deep_analysis ? `
              ${deepAnalysis.deep_analysis.key_clauses && deepAnalysis.deep_analysis.key_clauses.length > 0 ? `
                <h3>Key Clauses</h3>
                ${deepAnalysis.deep_analysis.key_clauses.map((clause, index) => `
                  <div class="clause-item">
                    <strong>${index + 1}. ${clause.title || 'Unknown Clause'}</strong><br>
                    ${clause.description || 'No description'}
                  </div>
                `).join('')}
              ` : ''}
              
              ${deepAnalysis.deep_analysis.obligations && deepAnalysis.deep_analysis.obligations.length > 0 ? `
                <h3>Obligations</h3>
                ${deepAnalysis.deep_analysis.obligations.map((obligation, index) => `
                  <div class="clause-item">
                    <strong>${index + 1}. ${obligation.party || 'Unknown'}</strong><br>
                    ${obligation.obligation || 'No obligation specified'}
                    ${obligation.deadline ? `<br><em>Deadline: ${obligation.deadline}</em>` : ''}
                  </div>
                `).join('')}
              ` : ''}
              
              ${deepAnalysis.deep_analysis.rights && deepAnalysis.deep_analysis.rights.length > 0 ? `
                <h3>Rights</h3>
                ${deepAnalysis.deep_analysis.rights.map((right, index) => `
                  <div class="clause-item">
                    <strong>${index + 1}. ${right.party || 'Unknown'}</strong><br>
                    ${right.right || 'No right specified'}
                    ${right.conditions ? `<br><em>Conditions: ${right.conditions}</em>` : ''}
                  </div>
                `).join('')}
              ` : ''}
              
              ${deepAnalysis.deep_analysis.financial_terms && deepAnalysis.deep_analysis.financial_terms.length > 0 ? `
                <h3>Financial Terms</h3>
                ${deepAnalysis.deep_analysis.financial_terms.map((term, index) => `
                  <div class="clause-item">
                    <strong>${index + 1}. ${term.type || 'Unknown'}</strong><br>
                    ${term.amount || 'No amount specified'}
                    ${term.frequency ? `<br><em>Frequency: ${term.frequency}</em>` : ''}
                  </div>
                `).join('')}
              ` : ''}
            ` : '<p><em>No deep analysis data available.</em></p>'}
          </div>

          <div class="page-break"></div>
          
          <div class="section">
            <h2>RISK ASSESSMENT</h2>
            ${(() => {
              // Try different possible data structures - check nested under summary
              const risks = document?.risks || 
                           document?.summary?.risk_assessment?.primary_risks || 
                           document?.summary?.risk_assessment?.detailed_risk_analysis ||
                           document?.risk_assessment || 
                           document?.risk_analysis || [];
              console.log('Risks data found:', risks);
              console.log('Document summary risk assessment:', document?.summary?.risk_assessment);
              if (risks && risks.length > 0) {
                return risks.map((risk, index) => `
                  <div class="clause-item">
                    <strong>${index + 1}. ${risk.title || risk.name || risk.risk_type || 'Unknown Risk'}</strong>
                    <span class="risk-${risk.level || risk.severity || risk.risk_level || 'low'}"> (${risk.level || risk.severity || risk.risk_level || 'Unknown Level'})</span><br>
                    <strong>Description:</strong> ${risk.description || risk.details || risk.explanation || 'No description'}<br>
                    ${risk.evidence ? `<strong>Evidence:</strong> ${risk.evidence}<br>` : ''}
                    ${risk.impact ? `<strong>Business Impact:</strong> ${risk.impact}<br>` : ''}
                    ${risk.recommendations ? `<strong>Recommendations:</strong> ${risk.recommendations}<br>` : ''}
                    ${risk.likelihood ? `<strong>Likelihood:</strong> ${risk.likelihood}<br>` : ''}
                  </div>
                `).join('');
              } else {
                return '<p><em>No risks identified in the document analysis. (Debug: risks array is empty or undefined)</em></p>';
              }
            })()}
          </div>

          <div class="page-break"></div>
          
          <div class="section">
            <h2>ACTION ITEMS</h2>
            ${(() => {
              // Use the correct actionItems variable (separate from document)
              const checklist = actionItems?.action_items || [];
              console.log('Action items data found:', checklist);
              console.log('ActionItems variable:', actionItems);
              console.log('ActionItems action_items:', actionItems?.action_items);
              if (checklist && checklist.length > 0) {
                return checklist.map((item, index) => `
                  <div class="action-item">
                    <strong>${index + 1}. ${item.task || item.action || item.item || 'Unknown Task'}</strong><br>
                    <strong>Priority:</strong> <span class="risk-${item.priority || 'low'}">${item.priority || 'Unknown'}</span><br>
                    <strong>Due Date:</strong> ${item.dueDate || item.deadline || item.due_date || 'No due date'}<br>
                    ${item.description ? `<strong>Description:</strong> ${item.description}<br>` : ''}
                    ${item.assignedTo ? `<strong>Assigned To:</strong> ${item.assignedTo}<br>` : ''}
                    ${item.status ? `<strong>Status:</strong> ${item.status}<br>` : ''}
                    ${item.notes ? `<strong>Notes:</strong> ${item.notes}<br>` : ''}
                  </div>
                `).join('');
              } else {
                return '<p><em>No action items identified in the document analysis. (Debug: actionItems.action_items array is empty or undefined)</em></p>';
              }
            })()}
          </div>



          <div class="page-break"></div>
          
          <div class="section">
            <h2>LEGAL COMPLIANCE CHECKLIST</h2>
            <table>
              <tr><th>Compliance Area</th><th>Status</th><th>Notes</th></tr>
              <tr><td>Employment Law Compliance</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Anti-Discrimination Laws</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Wage and Hour Regulations</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Health and Safety Standards</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Privacy and Data Protection</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Intellectual Property Rights</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Non-Compete Enforceability</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
              <tr><td>Severance and Termination Laws</td><td>□ Compliant □ Non-Compliant</td><td></td></tr>
            </table>
          </div>
        </body>
        </html>
      `;
      
      // Create and download the HTML file with .doc extension
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${(document?.name || 'document').replace('.pdf', '')}_Analysis.doc`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Word document exported successfully!');
    } catch (error) {
      console.error('Error exporting Word document:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      alert('Error generating Word document. Please try again.');
    }
  };

  const createComprehensiveReport = (doc, deepAnalysisData) => {
    // Safety checks
    if (!doc) {
      console.error('Document data is missing');
      throw new Error('Document data is required for report generation');
    }
    
    console.log('Creating report with document:', doc);
    console.log('Deep analysis data:', deepAnalysisData);
    
    const children = [
      // Title Page
      new Paragraph({
                    text: "COMPREHENSIVE SIMPLELEGAL REPORT",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400, before: 400 }
      }),
      
      new Paragraph({
        text: `Document: ${doc.name}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: `Generated on: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      
      new PageBreak(),
      
      // Executive Summary
      new Paragraph({
        text: "EXECUTIVE SUMMARY",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "This comprehensive analysis provides a detailed examination of the legal document ",
            size: 24
          }),
          new TextRun({
            text: doc.name,
            bold: true,
            size: 24
          }),
          new TextRun({
            text: ". The analysis identifies key clauses, assesses risk levels, and provides actionable recommendations for improvement.",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      
      // Risk Overview Table
      new Paragraph({
        text: "RISK ASSESSMENT OVERVIEW",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }),
      
      (() => {
        try {
          return createRiskOverviewTable(doc);
        } catch (error) {
          console.error('Error creating risk overview table:', error);
          return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Error", bold: true })],
                    shading: { fill: "FEE2E2" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Could not load risk data", color: "DC2626" })]
                  })
                ]
              })
            ]
          });
        }
      })(),
      
      new Paragraph({
        spacing: { after: 400 }
      }),
      
      // Overview Section
      new Paragraph({
        text: "DOCUMENT OVERVIEW",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...(() => {
        try {
          return createOverviewSection(doc);
        } catch (error) {
          console.error('Error creating overview section:', error);
          return [
            new Paragraph({
              text: "Error loading overview data",
              color: "DC2626",
              italic: true
            })
          ];
        }
      })(),
      
      new PageBreak(),
      
      // Deep Analysis Section
      new Paragraph({
        text: "DEEP ANALYSIS",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...(() => {
        try {
          return createDeepAnalysisSection(doc, deepAnalysisData);
        } catch (error) {
          console.error('Error creating deep analysis section:', error);
          return [
            new Paragraph({
              text: "Error loading deep analysis data",
              color: "DC2626",
              italic: true
            })
          ];
        }
      })(),
      
      new PageBreak(),
      
      // Detailed Clause Analysis
      new Paragraph({
        text: "DETAILED CLAUSE ANALYSIS",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...(() => {
        try {
          return createClauseAnalysis(doc);
        } catch (error) {
          console.error('Error creating clause analysis section:', error);
          return [
            new Paragraph({
              text: "Error loading clause analysis data",
              color: "DC2626",
              italic: true
            })
          ];
        }
      })(),
      
      new PageBreak(),
      
      // Risk Assessment Section
      new Paragraph({
        text: "DETAILED RISK ASSESSMENT",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...(() => {
        try {
          return createRiskAssessment(doc);
        } catch (error) {
          console.error('Error creating risk assessment section:', error);
          return [
            new Paragraph({
              text: "Error loading risk assessment data",
              color: "DC2626",
              italic: true
            })
          ];
        }
      })(),
      
      new PageBreak(),
      
      // Action Items Section
      new Paragraph({
        text: "ACTION ITEMS AND RECOMMENDATIONS",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...(() => {
        try {
          return createActionItems(doc);
        } catch (error) {
          console.error('Error creating action items section:', error);
          return [
            new Paragraph({
              text: "Error loading action items data",
              color: "DC2626",
              italic: true
            })
          ];
        }
      })(),
      
      new PageBreak(),
      
      // Legal Compliance Section
      new Paragraph({
        text: "LEGAL COMPLIANCE CHECKLIST",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      ...createComplianceChecklist(doc),
      
      new PageBreak(),
      
      // Appendices
      new Paragraph({
        text: "APPENDICES",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: "A. Document Metadata",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      createMetadataTable(doc),
      
      new Paragraph({
        text: "B. Glossary of Legal Terms",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      createLegalGlossary(),
      
      new Paragraph({
        text: "C. Risk Mitigation Strategies",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      createRiskMitigationStrategies()
    ];

    return new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: children
      }]
    });
  };

  const createOverviewSection = (doc) => {
    const children = [];
    
    // Document Summary
    children.push(
      new Paragraph({
        text: "Document Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      new Paragraph({
        text: doc.summary || "No summary available for this document.",
        spacing: { after: 200 }
      })
    );
    
    // Ensure arrays exist
    const clauses = doc.clauses || [];
    const risks = doc.risks || [];
    const checklist = doc.checklist || [];
    
    // Key Statistics
    children.push(
      new Paragraph({
        text: "Key Statistics",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      new Paragraph({
        text: `• Total Clauses Identified: ${clauses.length}`,
        spacing: { after: 20 }
      }),
      
      new Paragraph({
        text: `• Total Risks Identified: ${risks.length}`,
        spacing: { after: 20 }
      }),
      
      new Paragraph({
        text: `• Action Items Required: ${checklist.length}`,
        spacing: { after: 200 }
      })
    );
    
    // Risk Summary
    const highRisks = risks.filter(r => r.level === 'high').length;
    const mediumRisks = risks.filter(r => r.level === 'medium').length;
    const lowRisks = risks.filter(r => r.level === 'low').length;
    
    children.push(
      new Paragraph({
        text: "Risk Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }),
      
      new Paragraph({
        text: `• High Risk Items: ${highRisks}`,
        color: "DC2626",
        spacing: { after: 20 }
      }),
      
      new Paragraph({
        text: `• Medium Risk Items: ${mediumRisks}`,
        color: "EA580C",
        spacing: { after: 20 }
      }),
      
      new Paragraph({
        text: `• Low Risk Items: ${lowRisks}`,
        color: "16A34A",
        spacing: { after: 200 }
      })
    );
    
    return children;
  };

  const createDeepAnalysisSection = (doc, deepAnalysisData) => {
    const children = [];
    
    if (!deepAnalysisData?.deep_analysis) {
      children.push(
        new Paragraph({
          text: "Deep analysis data is not available for this document.",
          italic: true,
          spacing: { after: 200 }
        })
      );
      return children;
    }
    
    const analysis = deepAnalysisData.deep_analysis;
    
    // Key Clauses
    if (analysis.key_clauses && analysis.key_clauses.length > 0) {
      children.push(
        new Paragraph({
          text: "Key Clauses",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.key_clauses.forEach((clause, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${clause.title}`,
            bold: true,
            spacing: { after: 20 }
          }),
          
          new Paragraph({
            text: clause.description,
            spacing: { after: 50 }
          })
        );
        
        if (clause.importance) {
          children.push(
            new Paragraph({
              text: `Importance: ${clause.importance}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Obligations
    if (analysis.obligations && analysis.obligations.length > 0) {
      children.push(
        new Paragraph({
          text: "Obligations",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.obligations.forEach((obligation, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${obligation.party} - ${obligation.obligation}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (obligation.deadline) {
          children.push(
            new Paragraph({
              text: `Deadline: ${obligation.deadline}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (obligation.consequences) {
          children.push(
            new Paragraph({
              text: `Consequences: ${obligation.consequences}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Rights
    if (analysis.rights && analysis.rights.length > 0) {
      children.push(
        new Paragraph({
          text: "Rights",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.rights.forEach((right, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${right.party} - ${right.right}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (right.conditions) {
          children.push(
            new Paragraph({
              text: `Conditions: ${right.conditions}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (right.limitations) {
          children.push(
            new Paragraph({
              text: `Limitations: ${right.limitations}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Financial Terms
    if (analysis.financial_terms && analysis.financial_terms.length > 0) {
      children.push(
        new Paragraph({
          text: "Financial Terms",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.financial_terms.forEach((term, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${term.type} - ${term.amount}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (term.frequency) {
          children.push(
            new Paragraph({
              text: `Frequency: ${term.frequency}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (term.conditions) {
          children.push(
            new Paragraph({
              text: `Conditions: ${term.conditions}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Timeline
    if (analysis.timeline && analysis.timeline.length > 0) {
      children.push(
        new Paragraph({
          text: "Timeline",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.timeline.forEach((item, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${item.event} - ${item.date}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (item.importance) {
          children.push(
            new Paragraph({
              text: `Importance: ${item.importance}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (item.consequences) {
          children.push(
            new Paragraph({
              text: `Consequences: ${item.consequences}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Termination Conditions
    if (analysis.termination_conditions && analysis.termination_conditions.length > 0) {
      children.push(
        new Paragraph({
          text: "Termination Conditions",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.termination_conditions.forEach((condition, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${condition.condition}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (condition.notice_required) {
          children.push(
            new Paragraph({
              text: `Notice Required: ${condition.notice_required}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (condition.who_can_terminate) {
          children.push(
            new Paragraph({
              text: `Who Can Terminate: ${condition.who_can_terminate}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (condition.consequences) {
          children.push(
            new Paragraph({
              text: `Consequences: ${condition.consequences}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Dispute Resolution
    if (analysis.dispute_resolution && analysis.dispute_resolution.length > 0) {
      children.push(
        new Paragraph({
          text: "Dispute Resolution",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.dispute_resolution.forEach((method, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${method.method}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (method.venue) {
          children.push(
            new Paragraph({
              text: `Venue: ${method.venue}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (method.governing_law) {
          children.push(
            new Paragraph({
              text: `Governing Law: ${method.governing_law}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (method.costs) {
          children.push(
            new Paragraph({
              text: `Costs: ${method.costs}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    // Penalties
    if (analysis.penalties && analysis.penalties.length > 0) {
      children.push(
        new Paragraph({
          text: "Penalties",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        })
      );
      
      analysis.penalties.forEach((penalty, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${penalty.violation} - ${penalty.penalty}`,
            bold: true,
            spacing: { after: 20 }
          })
        );
        
        if (penalty.who_pays) {
          children.push(
            new Paragraph({
              text: `Who Pays: ${penalty.who_pays}`,
              italic: true,
              spacing: { after: 20 }
            })
          );
        }
        
        if (penalty.enforcement) {
          children.push(
            new Paragraph({
              text: `Enforcement: ${penalty.enforcement}`,
              italic: true,
              spacing: { after: 50 }
            })
          );
        }
      });
      
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
    
    return children;
  };

  const createRiskOverviewTable = (doc) => {
    // Ensure doc and risks exist
    if (!doc) {
      console.warn('Document is undefined in createRiskOverviewTable');
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "Risk Level", bold: true })],
                shading: { fill: "F2F2F2" }
              }),
              new TableCell({
                children: [new Paragraph({ text: "Count", bold: true })],
                shading: { fill: "F2F2F2" }
              }),
              new TableCell({
                children: [new Paragraph({ text: "Description", bold: true })],
                shading: { fill: "F2F2F2" }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "No Data Available", color: "6B7280" })]
              }),
              new TableCell({
                children: [new Paragraph({ text: "0" })]
              }),
              new TableCell({
                children: [new Paragraph({ text: "Risk data not available" })]
              })
            ]
          })
        ]
      });
    }
    
    const risks = doc.risks || [];
    const highRisks = risks.filter(r => r && r.level === 'high').length;
    const mediumRisks = risks.filter(r => r && r.level === 'medium').length;
    const lowRisks = risks.filter(r => r && r.level === 'low').length;
    
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Risk Level", bold: true })],
              shading: { fill: "F2F2F2" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Count", bold: true })],
              shading: { fill: "F2F2F2" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Description", bold: true })],
              shading: { fill: "F2F2F2" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "High Risk", color: "DC2626" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: highRisks.toString() })]
            }),
            new TableCell({
              children: [new Paragraph({ text: "Critical issues requiring immediate attention and negotiation" })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Medium Risk", color: "EA580C" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: mediumRisks.toString() })]
            }),
            new TableCell({
              children: [new Paragraph({ text: "Moderate concerns that should be addressed during negotiations" })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Low Risk", color: "16A34A" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: lowRisks.toString() })]
            }),
            new TableCell({
              children: [new Paragraph({ text: "Minor issues or standard terms that are generally acceptable" })]
            })
          ]
        })
      ]
    });
  };

  const createClauseAnalysis = (doc) => {
    const children = [];
    const clauses = doc.clauses || [];
    
    clauses.forEach((clause, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${clause.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),
        
        new Paragraph({
          text: "Plain English Summary:",
          bold: true,
          spacing: { after: 50 }
        }),
        
        new Paragraph({
          text: clause.plainEnglish,
          spacing: { after: 100 }
        }),
        
        new Paragraph({
          text: `Risk Level: ${clause.riskLevel.toUpperCase()}`,
          bold: true,
          color: getRiskLevelColor(clause.riskLevel),
          spacing: { after: 50 }
        }),
        
        new Paragraph({
          text: "Risk Factors:",
          bold: true,
          spacing: { after: 50 }
        }),
        
        ...clause.riskReasons.map(reason => 
          new Paragraph({
            text: `• ${reason}`,
            spacing: { after: 20 }
          })
        ),
        
        new Paragraph({
          text: "Recommended Actions:",
          bold: true,
          spacing: { after: 50 }
        }),
        
        ...clause.actions.map(action => 
          new Paragraph({
            text: `• ${action.task} (Due: ${action.dueDate})`,
            spacing: { after: 20 }
          })
        ),
        
        new Paragraph({
          spacing: { after: 200 }
        })
      );
    });
    
    return children;
  };

  const createRiskAssessment = (doc) => {
    const children = [];
    const risks = doc.risks || [];
    
    risks.forEach((risk, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${risk.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),
        
        new Paragraph({
          text: `Risk Level: ${risk.level.toUpperCase()}`,
          bold: true,
          color: getRiskLevelColor(risk.level),
          spacing: { after: 50 }
        }),
        
        new Paragraph({
          text: "Description:",
          bold: true,
          spacing: { after: 50 }
        }),
        
        new Paragraph({
          text: risk.description,
          spacing: { after: 100 }
        }),
        
        new Paragraph({
        text: `Related Clause: ${(doc.clauses || []).find(c => c.id === risk.clauseId)?.title || 'Unknown'}`,
          italic: true,
          spacing: { after: 200 }
        })
      );
    });
    
    return children;
  };

  const createActionItems = (doc) => {
    const children = [];
    const checklist = doc.checklist || [];
    
    // Group by priority
    const highPriority = checklist.filter(item => item.priority === 'high');
    const mediumPriority = checklist.filter(item => item.priority === 'medium');
    const lowPriority = checklist.filter(item => item.priority === 'low');
    
    children.push(
      new Paragraph({
        text: "HIGH PRIORITY ACTIONS",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      })
    );
    
    highPriority.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${item.task}`,
          spacing: { after: 20 }
        }),
        
        new Paragraph({
          text: `   Due Date: ${item.dueDate}`,
          italic: true,
          spacing: { after: 50 }
        })
      );
    });
    
    children.push(
      new Paragraph({
        text: "MEDIUM PRIORITY ACTIONS",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      })
    );
    
    mediumPriority.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${item.task}`,
          spacing: { after: 20 }
        }),
        
        new Paragraph({
          text: `   Due Date: ${item.dueDate}`,
          italic: true,
          spacing: { after: 50 }
        })
      );
    });
    
    children.push(
      new Paragraph({
        text: "LOW PRIORITY ACTIONS",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      })
    );
    
    lowPriority.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${item.task}`,
          spacing: { after: 20 }
        }),
        
        new Paragraph({
          text: `   Due Date: ${item.dueDate}`,
          italic: true,
          spacing: { after: 50 }
        })
      );
    });
    
    return children;
  };

  const createComplianceChecklist = (doc) => {
    const complianceItems = [
      "Employment Law Compliance",
      "Anti-Discrimination Laws",
      "Wage and Hour Regulations",
      "Health and Safety Standards",
      "Privacy and Data Protection",
      "Intellectual Property Rights",
      "Non-Compete Enforceability",
      "Severance and Termination Laws"
    ];
    
    const children = [];
    
    complianceItems.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `□ ${item}`,
          spacing: { after: 30 }
        })
      );
    });
    
    children.push(
      new Paragraph({
        text: "Note: This checklist should be reviewed by legal counsel to ensure compliance with applicable laws and regulations.",
        italic: true,
        spacing: { after: 200 }
      })
    );
    
    return children;
  };

  const createMetadataTable = (doc) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Property", bold: true })],
              shading: { fill: "F2F2F2" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Value", bold: true })],
              shading: { fill: "F2F2F2" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Document Name" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: doc.name })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Analysis Date" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: new Date().toLocaleDateString() })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Total Clauses" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: (doc.clauses || []).length.toString() })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Total Risks" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: (doc.risks || []).length.toString() })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Action Items" })]
            }),
            new TableCell({
              children: [new Paragraph({ text: (doc.checklist || []).length.toString() })]
            })
          ]
        })
      ]
    });
  };

  const createLegalGlossary = () => {
    const terms = [
      { term: "Non-Compete Agreement", definition: "A contract clause that restricts an employee from working for competitors after leaving the company" },
      { term: "Severance Package", definition: "Compensation and benefits provided to an employee upon termination of employment" },
      { term: "Intellectual Property", definition: "Creations of the mind, such as inventions, literary works, and designs" },
      { term: "Confidentiality Clause", definition: "A provision that requires keeping certain information secret" },
      { term: "Termination Clause", definition: "A section that outlines the conditions and procedures for ending employment" }
    ];
    
    const children = [];
    
    terms.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${item.term}`,
          bold: true,
          spacing: { after: 20 }
        }),
        
        new Paragraph({
          text: item.definition,
          spacing: { after: 50 }
        })
      );
    });
    
    return children;
  };

  const createRiskMitigationStrategies = () => {
    const strategies = [
      "Negotiate favorable terms before signing",
      "Seek legal counsel for complex clauses",
      "Document all communications and agreements",
      "Understand state-specific employment laws",
      "Request modifications to overly restrictive terms",
      "Ensure adequate notice periods and severance",
      "Clarify ambiguous language in the contract",
      "Maintain records of all employment-related documents"
    ];
    
    const children = [];
    
    strategies.forEach((strategy, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${strategy}`,
          spacing: { after: 30 }
        })
      );
    });
    
    return children;
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return '#dc2626';
      case 'medium': return '#ea580c';
      case 'low': return '#16a34a';
      default: return '#4b5563';
    }
  };

  const getRiskLevelGradient = (level) => {
    switch (level) {
      case 'high': return 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)';
      case 'medium': return 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)';
      case 'low': return 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)';
      default: return 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return <FiAlertTriangle className="risk-icon high" size={24} />;
      case 'medium': return <FiShield className="risk-icon medium" size={24} />;
      case 'low': return <FiCheckCircle className="risk-icon low" size={24} />;
      default: return <FiFileText className="risk-icon" size={24} />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="document-view-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p>Analyzing your document...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="document-view-error">
        <h2>Error Loading Document</h2>
        <p>{error}</p>
        <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
      </div>
    );
  }

  // Show not found state
  if (!document) {
    return (
      <div className="document-view-error">
        <h2>Document not found</h2>
        <p>Could not load document with ID: {docId}</p>
        <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
      </div>
    );
  }

  // Calculate comprehensive risk statistics from all sources
  const calculateRiskStats = () => {
    let highRisks = 0;
    let mediumRisks = 0;
    let lowRisks = 0;

    // From document analysis risks
    if (document?.analysis?.risks) {
      highRisks += document.analysis.risks.filter(r => r.level === 'high').length;
      mediumRisks += document.analysis.risks.filter(r => r.level === 'medium').length;
      lowRisks += document.analysis.risks.filter(r => r.level === 'low').length;
    }

    // From deep analysis risks
    if (deepAnalysis?.deep_analysis?.risks) {
      highRisks += deepAnalysis.deep_analysis.risks.filter(r => r.level === 'high').length;
      mediumRisks += deepAnalysis.deep_analysis.risks.filter(r => r.level === 'medium').length;
      lowRisks += deepAnalysis.deep_analysis.risks.filter(r => r.level === 'low').length;
    }

    // From detailed risk analysis in summary (NEW STRUCTURE)
    if (document?.summary?.risk_assessment?.detailed_risk_analysis) {
      document.summary.risk_assessment.detailed_risk_analysis.forEach(category => {
        if (category.risks && category.risks.length > 0) {
          category.risks.forEach(risk => {
            if (risk.severity === 'high') highRisks++;
            else if (risk.severity === 'medium') mediumRisks++;
            else if (risk.severity === 'low') lowRisks++;
          });
        }
      });
    }

    // From primary risks in summary
    if (document?.summary?.risk_assessment?.primary_risks) {
      document.summary.risk_assessment.primary_risks.forEach(risk => {
        if (risk.level === 'high') highRisks++;
        else if (risk.level === 'medium') mediumRisks++;
        else if (risk.level === 'low') lowRisks++;
      });
    }

    // From action items (high priority action items indicate high risk)
    if (actionItems?.summary?.high_priority) {
      highRisks += actionItems.summary.high_priority;
    }



    // If no risks found, provide fallback based on overall risk level
    if (highRisks === 0 && mediumRisks === 0 && lowRisks === 0) {
      const overallLevel = document?.summary?.overall_risk_level || 'unknown';
      if (overallLevel === 'high') highRisks = 1;
      else if (overallLevel === 'medium') mediumRisks = 1;
      else if (overallLevel === 'low') lowRisks = 1;
    }

    console.log('Risk Stats Calculation:', { highRisks, mediumRisks, lowRisks });
    return { highRisks, mediumRisks, lowRisks };
  };

  const { highRisks, mediumRisks, lowRisks } = calculateRiskStats();
  
  let overallRiskLevel = 'low';
  if (highRisks > 0) overallRiskLevel = 'high';
  else if (mediumRisks > 0) overallRiskLevel = 'medium';

  // Debug logging for overview data
  console.log('DocumentView: Overview Data Debug:', {
    documentSummary: document?.summary,
    riskAssessment: document?.summary?.risk_assessment,
    detailedRiskAnalysis: document?.summary?.risk_assessment?.detailed_risk_analysis,
    primaryRisks: document?.summary?.risk_assessment?.primary_risks,
    actionItems: actionItems,
    actionItemsCount: actionItems?.action_items?.length,
    actionItemsSummary: actionItems?.summary,
    calculatedRisks: { highRisks, mediumRisks, lowRisks }
  });

  console.log('DocumentView: All data present, rendering content');

  return (
    <div className="document-view-layout">
      {/* Left Sidebar Navigation */}
      <motion.aside 
        className="document-sidebar"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="sidebar-header">
          <button 
            className="sidebar-back-button"
            onClick={handleBackToDashboard}
          >
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          
            <div className="document-meta">
              <div className="document-icon">
                <FiFileText size={24} />
              </div>
              <div className="document-info">
                <h2>{document.name}</h2>
              </div>
            </div>
            </div>

        <nav className="sidebar-navigation">
          <div className="nav-section">
            <h3>Document Analysis</h3>
          {[
            { id: 'overview', label: 'Overview', icon: <FiBarChart size={20} /> },
            { id: 'analysis', label: 'Deep Analysis', icon: <FiTarget size={20} /> },
            { id: 'risks', label: 'Risk Assessment', icon: <FiAlertTriangle size={20} /> },
            { id: 'actions', label: 'Risk Actions', icon: <FiZap size={20} /> },
            { id: 'qa', label: 'Q&A Chat', icon: <FiMessageCircle size={20} /> }
            ].map((tab) => (
            <button
              key={tab.id}
                className={`sidebar-nav-item ${activeSection === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSection(tab.id)}
            >
              <div className="nav-icon">
                {tab.icon}
              </div>
              <div className="nav-text">
                {tab.label}
              </div>
            </button>
          ))}
        </div>

          <div className="nav-section">
            <h3>Actions</h3>
            <button
              className="sidebar-action-button"
              onClick={handleExportWord}
            >
              <FiDownload size={18} />
              <span>Export Word Report</span>
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Right Content Area */}
      <motion.main 
        className="document-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >


        {/* Content Sections */}
        <div className="content-sections">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="overview-section">
            {/* Compact Risk Assessment */}
            <motion.div className="compact-risk-section" variants={itemVariants}>
              <Card className={`compact-risk-card risk-${document.summary?.overall_risk_level || 'unknown'}`}>
                <div className="compact-risk-content">
                  <div className="compact-risk-icon">
                    {document.summary?.overall_risk_level === 'high' && <FiAlertTriangle size={24} />}
                    {document.summary?.overall_risk_level === 'medium' && <FiAlertCircle size={24} />}
                    {document.summary?.overall_risk_level === 'low' && <FiCheckCircle size={24} />}
                    {!document.summary?.overall_risk_level && <FiHelpCircle size={24} />}
                  </div>
                  <div className="compact-risk-info">
                    <h3>Risk Level</h3>
                    <span className={`compact-risk-badge risk-${document.summary?.overall_risk_level || 'unknown'}`}>
                      {document.summary?.overall_risk_level?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

                            {/* Document Overview - Prominent at Top */}
                <motion.div className="document-overview-section" variants={itemVariants}>
                  <Card className="overview-card prominent">
                    <div className="card-header">
                      <FiFileText size={24} />
                      <h3>Document Overview</h3>
                      {document.analysis.ai_generated && (
                        <div className="ai-badge">
                          <FiZap size={16} />
                          <span>AI Generated</span>
                        </div>
                      )}
                    </div>
                    <div className="card-content">
                      <div className="overview-content">
                        <div className="overview-summary">
                          <h4>Summary</h4>
                          <p>{document.summary?.summary || document.analysis.summary || 'Summary not available'}</p>
                        </div>
                        <div className="overview-details">
                          <div className="detail-item">
                            <span className="detail-label">Document Type:</span>
                            <span className="detail-value">{document.summary?.document_type || document.analysis.document_type || 'Not specified'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Parties Involved:</span>
                            <span className="detail-value">
                              {(document.summary?.parties_involved && document.summary.parties_involved.length > 0) 
                                ? document.summary.parties_involved.join(', ')
                                : (document.analysis.parties_involved && document.analysis.parties_involved.length > 0 
                                  ? document.analysis.parties_involved.join(', ') 
                                  : 'Not specified')}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Key Terms:</span>
                            <span className="detail-value">
                              {(document.summary?.key_terms && document.summary.key_terms.length > 0)
                                ? document.summary.key_terms.slice(0, 3).join(', ')
                                : (document.analysis.key_terms && document.analysis.key_terms.length > 0
                                  ? document.analysis.key_terms.slice(0, 3).join(', ')
                                  : 'Not specified')}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Risk Level:</span>
                            <span className={`detail-value risk-indicator risk-${document.summary?.overall_risk_level || 'unknown'}`}>
                              {document.summary?.overall_risk_level?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </div>
                          {document.analysis.legal_implications && document.analysis.legal_implications.length > 0 && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Legal Implications:</span>
                              <span className="detail-value">
                                {document.analysis.legal_implications.slice(0, 2).join('; ')}
                              </span>
                            </div>
                          )}
                          {document.analysis.compliance_issues && document.analysis.compliance_issues.length > 0 && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Compliance Issues:</span>
                              <span className="detail-value">
                                {document.analysis.compliance_issues.slice(0, 2).join('; ')}
                              </span>
                            </div>
                          )}
                          {document.summary?.main_points && document.summary.main_points.length > 0 && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Main Points:</span>
                              <span className="detail-value">
                                {document.summary.main_points.slice(0, 2).join('; ')}
                              </span>
                            </div>
                          )}
                          {document.analysis.negotiation_points && document.analysis.negotiation_points.length > 0 && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Negotiation Points:</span>
                              <span className="detail-value">
                                {document.analysis.negotiation_points.slice(0, 2).join('; ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

            {/* Additional Overview Cards */}
            <motion.div className="overview-grid" variants={itemVariants}>
              <Card className="overview-card">
                <div className="card-header">
                  <FiAlertTriangle size={24} />
                  <h3>Risk Summary</h3>
                </div>
                <div className="card-content">
                  <div className="risk-stats">
                    <div className="risk-stat">
                      <span className="risk-count high">{highRisks}</span>
                      <span className="risk-label">High Risk</span>
                    </div>
                    <div className="risk-stat">
                      <span className="risk-count medium">{mediumRisks}</span>
                      <span className="risk-label">Medium Risk</span>
                    </div>
                    <div className="risk-stat">
                      <span className="risk-count low">{lowRisks}</span>
                      <span className="risk-label">Low Risk</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="overview-card">
                <div className="card-header">
                  <FiZap size={24} />
                  <h3>Risk Mitigation Actions</h3>
                </div>
                <div className="card-content">
                  <div className="action-summary">
                      <span className="action-count">
                        {actionItems?.action_items?.length || actionItems?.summary?.total_actions || 0}
                      </span>
                    <span className="action-label">Actions to reduce risk</span>
                  </div>
                    {(actionItems?.summary?.high_priority > 0 || actionItems?.action_items?.filter(item => item.priority === 'high').length > 0) && (
                    <div className="action-priority">
                        <span className="priority-high">
                          {actionItems?.summary?.high_priority || actionItems?.action_items?.filter(item => item.priority === 'high').length || 0} high priority
                        </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Deep Analysis Section */}
        {activeSection === 'analysis' && (
          <div className="analysis-section">
            <motion.div className="section-header" variants={itemVariants}>
              <h2>Deep Analysis</h2>
              <p>Comprehensive document analysis with structured insights and detailed breakdowns</p>
            </motion.div>

            {/* Structured Analysis Overview */}
            {deepAnalysis?.deep_analysis ? (
              <motion.div className="structured-analysis" variants={itemVariants}>
                <div className="analysis-grid">
                  {/* Key Clauses */}
                  {deepAnalysis.deep_analysis.key_clauses && deepAnalysis.deep_analysis.key_clauses.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiFileText size={24} />
                        <h3>Key Clauses</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.key_clauses.map((clause, index) => (
                            <li key={index}>
                              <strong>{clause.title}</strong> - {clause.description}
                              {clause.importance && <span className={`importance-badge ${clause.importance}`}>{clause.importance}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Obligations */}
                  {deepAnalysis.deep_analysis.obligations && deepAnalysis.deep_analysis.obligations.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiTarget size={24} />
                        <h3>Obligations</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.obligations.map((obligation, index) => (
                            <li key={index}>
                              <strong>{obligation.party}</strong> - {obligation.obligation}
                              {obligation.deadline && <div className="detail-info">Deadline: {obligation.deadline}</div>}
                              {obligation.consequences && <div className="detail-info">Consequences: {obligation.consequences}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Rights */}
                  {deepAnalysis.deep_analysis.rights && deepAnalysis.deep_analysis.rights.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiShield size={24} />
                        <h3>Rights</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.rights.map((right, index) => (
                            <li key={index}>
                              <strong>{right.party}</strong> - {right.right}
                              {right.conditions && <div className="detail-info">Conditions: {right.conditions}</div>}
                              {right.limitations && <div className="detail-info">Limitations: {right.limitations}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Financial Terms */}
                  {deepAnalysis.deep_analysis.financial_terms && deepAnalysis.deep_analysis.financial_terms.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiDollarSign size={24} />
                        <h3>Financial Terms</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.financial_terms.map((term, index) => (
                            <li key={index}>
                              <strong>{term.type}</strong> - {term.amount}
                              {term.frequency && <div className="detail-info">Frequency: {term.frequency}</div>}
                              {term.conditions && <div className="detail-info">Conditions: {term.conditions}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Timeline */}
                  {deepAnalysis.deep_analysis.timeline && deepAnalysis.deep_analysis.timeline.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiCalendar size={24} />
                        <h3>Timeline</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.timeline.map((item, index) => (
                            <li key={index}>
                              <strong>{item.event}</strong> - {item.date}
                              {item.importance && <span className={`importance-badge ${item.importance}`}>{item.importance}</span>}
                              {item.consequences && <div className="detail-info">Consequences: {item.consequences}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Termination Conditions */}
                  {deepAnalysis.deep_analysis.termination_conditions && deepAnalysis.deep_analysis.termination_conditions.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiAlertTriangle size={24} />
                        <h3>Termination Conditions</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.termination_conditions.map((condition, index) => (
                            <li key={index}>
                              <strong>{condition.condition}</strong>
                              {condition.notice_required && <div className="detail-info">Notice: {condition.notice_required}</div>}
                              {condition.who_can_terminate && <div className="detail-info">Who: {condition.who_can_terminate}</div>}
                              {condition.consequences && <div className="detail-info">Consequences: {condition.consequences}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Dispute Resolution */}
                  {deepAnalysis.deep_analysis.dispute_resolution && deepAnalysis.deep_analysis.dispute_resolution.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiUsers size={24} />
                        <h3>Dispute Resolution</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.dispute_resolution.map((method, index) => (
                            <li key={index}>
                              <strong>{method.method}</strong>
                              {method.venue && <div className="detail-info">Venue: {method.venue}</div>}
                              {method.governing_law && <div className="detail-info">Law: {method.governing_law}</div>}
                              {method.costs && <div className="detail-info">Costs: {method.costs}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {/* Penalties */}
                  {deepAnalysis.deep_analysis.penalties && deepAnalysis.deep_analysis.penalties.length > 0 && (
                    <Card className="analysis-card">
                      <div className="analysis-card-header">
                        <FiAlertCircle size={24} />
                        <h3>Penalties</h3>
                      </div>
                      <div className="analysis-card-content">
                        <ul>
                          {deepAnalysis.deep_analysis.penalties.map((penalty, index) => (
                            <li key={index}>
                              <strong>{penalty.violation}</strong> - {penalty.penalty}
                              {penalty.who_pays && <div className="detail-info">Who Pays: {penalty.who_pays}</div>}
                              {penalty.enforcement && <div className="detail-info">Enforcement: {penalty.enforcement}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div className="no-deep-analysis" variants={itemVariants}>
                <Card className="no-data-card">
                  <div className="no-data-content">
                    <FiFileText size={48} />
                    <h3>Deep Analysis Not Available</h3>
                    <p>Detailed analysis data is not available for this document. This may be because:</p>
                    <ul>
                      <li>The document is still being processed</li>
                      <li>Deep analysis failed during processing</li>
                      <li>The document format is not supported for deep analysis</li>
                    </ul>
                    <p>Please try refreshing the page or contact support if the issue persists.</p>
                  </div>
                </Card>
              </motion.div>
            )}


          </div>
        )}

        {/* Risk Assessment Section */}
        {activeSection === 'risks' && (
          <div className="risks-section">
            <motion.div className="section-header" variants={itemVariants}>
              <h2>Risk Assessment</h2>
              <p>Detailed analysis of identified risks and their implications</p>
            </motion.div>

            {/* Overall Risk Summary */}
            <motion.div className="overall-risk-summary" variants={itemVariants}>
              <Card className="risk-summary-card">
                <div className="risk-summary-header">
                  <div className="risk-summary-icon">
                    {getRiskIcon(document.summary?.overall_risk_level || 'unknown')}
                  </div>
                  <div className="risk-summary-info">
                    <h3>Overall Risk Level</h3>
                    <span className={`risk-level-badge risk-${document.summary?.overall_risk_level || 'unknown'}`}>
                      {document.summary?.overall_risk_level?.toUpperCase() || 'UNKNOWN'} RISK
                    </span>
                  </div>
                </div>
                {document.summary?.risk_assessment?.primary_risks?.[0]?.risk && (
                  <p className="risk-summary-description">
                    {document.summary.risk_assessment.primary_risks[0].risk}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Risk Factors */}
            {document.summary?.risk_assessment?.risk_factors && document.summary.risk_assessment.risk_factors.length > 0 && (
              <motion.div className="risk-factors-section" variants={itemVariants}>
                <h3>Risk Factors</h3>
                <div className="risk-factors-grid">
                  {document.summary.risk_assessment.risk_factors.map((factor, index) => (
                    <Card key={index} className="risk-factor-card">
                      <div className="risk-factor-content">
                        <FiAlertCircle size={20} className="risk-factor-icon" />
                        <span>{factor}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Primary Risks from Summary */}
            {document.summary?.risk_assessment?.primary_risks && document.summary.risk_assessment.primary_risks.length > 0 && (
              <motion.div className="primary-risks-section" variants={itemVariants}>
                <h3>Primary Risks</h3>
                <div className="primary-risks-grid">
                  {document.summary.risk_assessment.primary_risks.map((risk, index) => (
                    <Card key={index} className="primary-risk-card">
                      <div className="primary-risk-header">
                        <div className="primary-risk-icon">
                          {getRiskIcon(risk.level)}
                        </div>
                        <div className="primary-risk-info">
                          <h4>{risk.risk}</h4>
                          <span className={`risk-level-badge risk-${risk.level}`}>
                            {risk.level.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                      <div className="primary-risk-body">
                        {risk.impact && (
                          <div className="risk-impact">
                            <h5>Impact:</h5>
                            <p>{risk.impact}</p>
                          </div>
                        )}
                        {risk.mitigation && (
                          <div className="risk-mitigation">
                            <h5>Mitigation:</h5>
                            <p>{risk.mitigation}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

              {/* Detailed Risk Analysis from Summary */}
              {document.summary?.risk_assessment?.detailed_risk_analysis && document.summary.risk_assessment.detailed_risk_analysis.length > 0 && (
                <motion.div className="detailed-risks-section" variants={itemVariants}>
                  <h3>Detailed Risk Analysis</h3>
                  <div className="detailed-risks-container">
                    {document.summary.risk_assessment.detailed_risk_analysis.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="risk-category">
                        <h4 className="risk-category-title">{category.category}</h4>
                        <div className="category-risks-grid">
                          {category.risks && category.risks.length > 0 ? (
                            category.risks.map((risk, riskIndex) => (
                              <motion.div 
                                key={riskIndex}
                                className="detailed-risk-card"
                                variants={itemVariants}
                              >
                                <Card className="risk-content">
                                  <div className="risk-header">
                                    <div className="risk-icon">
                                      {getRiskIcon(risk.severity)}
                                    </div>
                                    <div className="risk-info">
                                      <h3>{risk.title}</h3>
                                      <div className="risk-levels">
                                        <span 
                                          className="risk-level"
                                          style={{ color: getRiskLevelColor(risk.severity) }}
                                        >
                                          Severity: {risk.severity.toUpperCase()}
                                        </span>
                                        <span 
                                          className="risk-level"
                                          style={{ color: getRiskLevelColor(risk.likelihood) }}
                                        >
                                          Likelihood: {risk.likelihood.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="risk-body">
                                    <p className="risk-description">{risk.description}</p>
                                    
                                    {risk.document_evidence && (
                                      <div className="risk-evidence">
                                        <h5>Document Evidence:</h5>
                                        <p className="evidence-text">{risk.document_evidence}</p>
                                      </div>
                                    )}
                                    
                                    {risk.business_impact && (
                                      <div className="risk-impact">
                                        <h5>Business Impact:</h5>
                                        <p>{risk.business_impact}</p>
                                      </div>
                                    )}
                                    
                                    {risk.legal_implications && (
                                      <div className="risk-legal">
                                        <h5>Legal Implications:</h5>
                                        <p>{risk.legal_implications}</p>
                                      </div>
                                    )}
                                    
                                    {risk.recommended_actions && risk.recommended_actions.length > 0 && (
                                      <div className="risk-actions">
                                        <h5>Recommended Actions:</h5>
                                        <ul>
                                          {risk.recommended_actions.map((action, actionIndex) => (
                                            <li key={actionIndex}>{action}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              </motion.div>
                            ))
                          ) : (
                            <Card className="no-risks-card">
                              <p>No specific {category.category.toLowerCase()} identified in this document.</p>
                            </Card>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Fallback to Analysis Risks if Detailed Risk Analysis is not available */}
              {(!document.summary?.risk_assessment?.detailed_risk_analysis || document.summary.risk_assessment.detailed_risk_analysis.length === 0) && document.analysis?.risks && document.analysis.risks.length > 0 && (
            <motion.div className="detailed-risks-section" variants={itemVariants}>
              <h3>Detailed Risk Analysis</h3>
              <div className="risks-grid">
                {document.analysis.risks.map((risk, index) => (
                  <motion.div 
                    key={risk.id}
                    className="risk-card"
                    variants={itemVariants}
                  >
                    <Card className="risk-content">
                      <div className="risk-header">
                        <div className="risk-icon">
                          {getRiskIcon(risk.level)}
                        </div>
                        <div className="risk-info">
                          <h3>{risk.title}</h3>
                          <span 
                            className="risk-level"
                            style={{ color: getRiskLevelColor(risk.level) }}
                          >
                            {risk.level.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                      
                      <div className="risk-body">
                        <p>{risk.description}</p>
                        {risk.evidence && (
                          <div className="risk-evidence">
                            <h5>Evidence from Document:</h5>
                            <p className="evidence-text">{risk.evidence}</p>
                          </div>
                        )}
                        <div className="risk-meta">
                          <span>Related to: {document.analysis.clauses.find(c => c.id === risk.clauseId)?.title || 'Unknown clause'}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
              )}

            {/* Risk Recommendations */}
            {document.summary?.risk_assessment?.recommendations && document.summary.risk_assessment.recommendations.length > 0 && (
              <motion.div className="risk-recommendations-section" variants={itemVariants}>
                <h3>Risk Mitigation Recommendations</h3>
                <div className="recommendations-list">
                  {document.summary.risk_assessment.recommendations.map((recommendation, index) => (
                    <Card key={index} className="recommendation-card">
                      <div className="recommendation-content">
                        <div className="recommendation-number">{index + 1}</div>
                        <div className="recommendation-text">
                          <p>{recommendation}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Action Items Section */}
        {activeSection === 'actions' && (
          <div className="actions-section">
            <motion.div className="section-header" variants={itemVariants}>
              <h2>Risk Mitigation Actions</h2>
              <p>Legal recommendations and negotiation strategies to reduce risk factors</p>
            </motion.div>

            {/* Action Items Summary */}
            <motion.div className="action-summary-section" variants={itemVariants}>
              <Card className="summary-card">
                <div className="summary-stats">
                  <div className="stat-item">
                    <FiTarget size={24} />
                    <div className="stat-content">
                      <span className="stat-number">{actionItems?.summary?.total_actions || 0}</span>
                      <span className="stat-label">Risk Actions</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FiAlertTriangle size={24} />
                    <div className="stat-content">
                      <span className="stat-number">{actionItems?.summary?.high_priority || 0}</span>
                      <span className="stat-label">High Risk</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FiShield size={24} />
                    <div className="stat-content">
                      <span className="stat-number">{actionItems?.summary?.legal_consultation_needed || 0}</span>
                      <span className="stat-label">Legal Review</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FiUsers size={24} />
                    <div className="stat-content">
                      <span className="stat-number">{actionItems?.summary?.negotiation_points || 0}</span>
                      <span className="stat-label">Negotiate</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Action Items by Category */}
            <div className="actions-container">
              {/* High Risk Actions */}
              {actionItems?.action_items?.filter(item => item.priority === 'high').length > 0 && (
                <motion.div className="priority-section" variants={itemVariants}>
                  <h3 className="priority-title high">
                    <FiAlertTriangle size={20} />
                    High Risk - Immediate Action Required
                  </h3>
                  <div className="actions-list">
                    {actionItems.action_items
                      .filter(item => item.priority === 'high')
                      .map((item, index) => (
                        <ActionItemCard 
                          key={item.id} 
                          item={item} 
                          onStatusUpdate={handleActionItemStatusUpdate}
                          onAddNote={handleActionItemNoteAdd}
                        />
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Medium Risk Actions */}
              {actionItems?.action_items?.filter(item => item.priority === 'medium').length > 0 && (
                <motion.div className="priority-section" variants={itemVariants}>
                  <h3 className="priority-title medium">
                    <FiAlertCircle size={20} />
                    Medium Risk - Review & Consider
                  </h3>
                  <div className="actions-list">
                    {actionItems.action_items
                      .filter(item => item.priority === 'medium')
                      .map((item, index) => (
                        <ActionItemCard 
                          key={item.id} 
                          item={item} 
                          onStatusUpdate={handleActionItemStatusUpdate}
                          onAddNote={handleActionItemNoteAdd}
                        />
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Low Risk Actions */}
              {actionItems?.action_items?.filter(item => item.priority === 'low').length > 0 && (
                <motion.div className="priority-section" variants={itemVariants}>
                  <h3 className="priority-title low">
                    <FiCheckCircle size={20} />
                    Low Risk - Optional Improvements
                  </h3>
                  <div className="actions-list">
                    {actionItems.action_items
                      .filter(item => item.priority === 'low')
                      .map((item, index) => (
                        <ActionItemCard 
                          key={item.id} 
                          item={item} 
                          onStatusUpdate={handleActionItemStatusUpdate}
                          onAddNote={handleActionItemNoteAdd}
                        />
                      ))}
                  </div>
                </motion.div>
              )}

              {/* No Risk Actions */}
              {(!actionItems?.action_items || actionItems.action_items.length === 0) && (
                <motion.div className="no-actions-message" variants={itemVariants}>
                  <Card className="no-data-card">
                    <div className="no-data-content">
                      <FiTarget size={48} />
                      <h3>No Risk Mitigation Actions Identified</h3>
                      <p>
                        Our AI analysis did not identify specific risk factors requiring action in this document. This could mean:
                      </p>
                      <ul>
                        <li>The document has balanced and fair terms</li>
                        <li>Risk factors are already adequately addressed</li>
                        <li>The document follows standard industry practices</li>
                        <li>Consider having a legal professional review for completeness</li>
                      </ul>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Q&A Chat Section */}
        {activeSection === 'qa' && (
          <div className="qa-section">
            <div className="qa-container">
              <div className="qa-messages" ref={qaContainerRef}>
                {qaMessages.length === 0 ? (
                  <div className="qa-welcome">
                    <FiMessageCircle size={48} />
                    <h3>Start a conversation about your document</h3>
                    <p>Ask questions about clauses, risks, legal implications, or any aspect of the document.</p>
                    <div className="qa-suggestions">
                      <h4>Suggested questions:</h4>
                      <ul>
                        <li onClick={() => handleSuggestedQuestion("What are the main risks in this document?")}>
                          "What are the main risks in this document?"
                        </li>
                        <li onClick={() => handleSuggestedQuestion("Explain the termination clause in plain English")}>
                          "Explain the termination clause in plain English"
                        </li>
                        <li onClick={() => handleSuggestedQuestion("What should I negotiate before signing?")}>
                          "What should I negotiate before signing?"
                        </li>
                        <li onClick={() => handleSuggestedQuestion("Are there any compliance issues?")}>
                          "Are there any compliance issues?"
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  qaMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`qa-message ${message.type}`}
                    >
                      <div className="message-avatar">
                        {message.type === 'user' ? <FiUser size={20} /> : <FiCpu size={20} />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom styling for different markdown elements
                              h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
                              h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
                              h4: ({node, ...props}) => <h4 className="markdown-h4" {...props} />,
                              p: ({node, ...props}) => <p className="markdown-p" {...props} />,
                              ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
                              ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
                              li: ({node, ...props}) => <li className="markdown-li" {...props} />,
                              strong: ({node, ...props}) => <strong className="markdown-strong" {...props} />,
                              em: ({node, ...props}) => <em className="markdown-em" {...props} />,
                              code: ({node, inline, ...props}) => 
                                inline ? 
                                  <code className="markdown-inline-code" {...props} /> : 
                                  <code className="markdown-code-block" {...props} />,
                              pre: ({node, ...props}) => <pre className="markdown-pre" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />,
                              table: ({node, ...props}) => <table className="markdown-table" {...props} />,
                              thead: ({node, ...props}) => <thead className="markdown-thead" {...props} />,
                              tbody: ({node, ...props}) => <tbody className="markdown-tbody" {...props} />,
                              tr: ({node, ...props}) => <tr className="markdown-tr" {...props} />,
                              th: ({node, ...props}) => <th className="markdown-th" {...props} />,
                              td: ({node, ...props}) => <td className="markdown-td" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.citations && message.citations.length > 0 && (
                          <div className="message-citations">
                            <h4>Citations:</h4>
                            {message.citations.map((citation, idx) => (
                              <div key={idx} className="citation">
                                <span className="citation-clause">Clause: {citation.clauseId}</span>
                                <span className="citation-page">Page: {citation.page}</span>
                                <p className="citation-excerpt">{citation.excerpt}</p>
                                {citation.relevance && (
                                  <p className="citation-relevance">Relevance: {citation.relevance}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {message.source_sections && message.source_sections.length > 0 && (
                          <div className="message-sources">
                            <h4>Document Sections Referenced:</h4>
                            <ul>
                              {message.source_sections.map((section, idx) => (
                                <li key={idx}>{section}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {message.additional_context && (
                          <div className="message-context">
                            <h4>Additional Context:</h4>
                            <p>{message.additional_context}</p>
                          </div>
                        )}
                        {message.confidence && (
                          <div className="message-confidence">
                            Confidence: {Math.round(message.confidence * 100)}%
                          </div>
                        )}
                        <div className="message-time">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isAskingQuestion && (
                                     <div className="qa-message ai">
                     <div className="message-avatar">
                       <FiCpu size={20} />
                     </div>
                    <div className="message-content">
                      <div className="message-typing">
                        <div className="typing-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="qa-input">
                <div className="input-container">
                  <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your document..."
                    disabled={isAskingQuestion}
                    rows={1}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!currentQuestion.trim() || isAskingQuestion}
                    className="send-button"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </motion.main>
    </div>
  );
};

export default DocumentView; 