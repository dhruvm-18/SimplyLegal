import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../lib/api';
import Button from '../components/Button';
import { FiZap, FiCheck, FiClock, FiArrowRight, FiUpload } from 'react-icons/fi';
import './ProcessingScreen.css';

// Custom hook for smooth progress animation with consistent 1% increments
const useSmoothProgress = (targetProgress, duration = 2000) => {
  const [smoothProgress, setSmoothProgress] = useState(0);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startProgress = smoothProgress;
    const endProgress = targetProgress;
    const startTime = performance.now();
    const totalSteps = endProgress - startProgress;
    const stepDuration = duration / totalSteps;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const currentStep = Math.floor(elapsed / stepDuration);
      const newProgress = Math.min(startProgress + currentStep, endProgress);
      
      if (newProgress !== smoothProgress) {
        setSmoothProgress(newProgress);
      }

      if (newProgress < endProgress) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (totalSteps > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetProgress, duration]);

  return smoothProgress;
};

const ProcessingScreen = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [targetProgress, setTargetProgress] = useState(0);
  const [message, setMessage] = useState('Initializing document analysis...');
  const [error, setError] = useState(null);
  const [currentFact, setCurrentFact] = useState('');
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [highestStepReached, setHighestStepReached] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [estimatedDuration] = useState(120000); // 2 minutes in milliseconds
  
  // Use smooth progress animation with consistent 1% increments
  const smoothProgress = useSmoothProgress(targetProgress, 3000);
  
  // Legal facts to display during processing
  const legalFacts = [
    "Did you know? The average legal document contains 15-25 distinct clauses that require careful analysis.",
    "Legal AI can process documents 10x faster than human lawyers while maintaining 95% accuracy.",
    "Over 80% of contract disputes arise from unclear or ambiguous language in legal documents.",
    "The legal industry processes over 2.5 billion documents annually, with AI helping to streamline this process.",
    "Modern legal AI can identify risk factors in contracts with 90% accuracy, saving hours of manual review.",
    "Legal document analysis dates back to ancient Rome, where contracts were carved in stone for permanence.",
    "The average lawyer spends 40% of their time reviewing and analyzing legal documents.",
    "AI-powered legal analysis can detect hidden clauses and potential conflicts that humans might miss.",
    "Legal documents contain an average of 3-5 critical risk factors that require immediate attention.",
    "The most common legal document types are contracts, agreements, and compliance documents."
  ];
  
  const [processingSteps] = useState([
    { id: 'upload', label: 'Upload', icon: FiUpload, weight: 5 },
    { id: 'extract', label: 'Extract Text', icon: FiZap, weight: 15 },
    { id: 'summary', label: 'Create Summary', icon: FiZap, weight: 25 },
    { id: 'deep', label: 'Deep Analysis', icon: FiZap, weight: 35 },
    { id: 'index', label: 'Index Document', icon: FiZap, weight: 20 }
  ]);

  // Faster step timing for 2-minute total process
  const stepDurations = [6, 18, 24, 30, 30, 12]; // Total: 120 seconds (2 minutes)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const statusData = await apiService.getDocumentStatus(docId);
        setStatus(statusData.status);
        setMessage(statusData.message || statusData.status);

        if (statusData.status === 'completed') {
          // Navigate to document view after a short delay
          setTimeout(() => {
            navigate(`/document/${docId}`);
          }, 2000);
        } else if (statusData.status === 'failed' || statusData.status === 'error') {
          setError(statusData.message || 'Document processing failed. Please try again.');
        } else {
          // Continue polling
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setError('Error checking document status. Please try again.');
      }
    };

    // Start polling
    const timer = setTimeout(checkStatus, 1000);

    return () => clearTimeout(timer);
  }, [docId, navigate]);

  const getCurrentStep = () => {
    // Map specific messages to steps with better accuracy
    const messageToStep = {
      'Extracting text from document...': 1,
      'Performing AI analysis with Gemini...': 2,
      'Creating document summary...': 2,
      'Performing deep analysis...': 3,
  
      'Indexing document for search...': 5,
      'Document analysis completed successfully!': 5,
    };
    
    // Map status to steps
    const statusToStep = {
      'processing': 1, // Extract Text
      'analyzing': 2,   // Create Summary
    };
    
    let currentStep = 0;
    
    if (status === 'completed') {
      currentStep = 5; // Index Document (last step)
    } else if (status === 'failed' || status === 'error') {
      currentStep = 0;
    } else if (messageToStep[message]) {
      currentStep = messageToStep[message];
    } else if (statusToStep[status]) {
      currentStep = statusToStep[status];
    }
    
    // Update highest step reached to prevent going backwards
    if (currentStep > highestStepReached) {
      setHighestStepReached(currentStep);
    }
    
    // Return the highest step reached to prevent backwards movement
    return Math.max(currentStep, highestStepReached);
  };

  const getStepStatus = (stepIndex) => {
    const currentStep = getCurrentStep();
    
    // Prevent going backwards - once a step is completed, it stays completed
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  // Calculate progress based on current step with better distribution
  const calculateProgress = () => {
    const currentStep = getCurrentStep();
    
    // Define step weights for better progress distribution
    const stepWeights = [5, 15, 20, 25, 25, 10]; // Total: 100
    let totalProgress = 0;
    
    // Add completed steps
    for (let i = 0; i < currentStep; i++) {
      totalProgress += stepWeights[i];
    }
    
    // Add partial progress for current step
    if (currentStep < stepWeights.length) {
      const timeSpent = Date.now() - lastProgressUpdate;
      const stepDuration = stepDurations[currentStep] * 1000; // Convert to milliseconds
      const stepProgress = Math.min(timeSpent / stepDuration, 1);
      totalProgress += stepWeights[currentStep] * stepProgress;
    }
    
    // Ensure progress doesn't exceed 100%
    return Math.min(Math.round(totalProgress), 100);
  };

  // Calculate remaining time
  const calculateRemainingTime = () => {
    if (status === 'completed') return 0;
    
    const elapsed = Date.now() - startTime;
    const progress = smoothProgress / 100;
    const estimatedTotal = estimatedDuration;
    
    if (progress > 0) {
      const remaining = Math.max(0, estimatedTotal - elapsed);
      return Math.round(remaining / 1000); // Return seconds
    }
    
    return Math.round(estimatedDuration / 1000);
  };

  // Format time display
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Update target progress when status or message changes
  useEffect(() => {
    const newProgress = calculateProgress();
    console.log(`Progress update - Status: ${status}, Message: ${message}, Current Step: ${getCurrentStep()}, New Progress: ${newProgress}, Target: ${targetProgress}`);
    
    if (newProgress > targetProgress) {
      setLastProgressUpdate(Date.now());
      setTargetProgress(newProgress);
    }
  }, [status, message]);

  // Continuous progress update for smoother movement
  useEffect(() => {
    if (status === 'completed') {
      // Ensure we reach 100% when completed
      setTargetProgress(100);
      return;
    }
    
    const progressInterval = setInterval(() => {
      const newProgress = calculateProgress();
      if (newProgress > targetProgress) {
        setTargetProgress(prev => Math.min(prev + 1, newProgress));
      } else if (targetProgress < 99 && status !== 'failed') {
        // Fallback: ensure progress keeps moving even if backend is slow
        setTargetProgress(prev => Math.min(prev + 0.3, 99));
      }
    }, 600); // Update every 600ms for smoother movement

    return () => clearInterval(progressInterval);
  }, [status, targetProgress, lastProgressUpdate]);

  // Rotate legal facts every 3 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      const randomFact = legalFacts[Math.floor(Math.random() * legalFacts.length)];
      setCurrentFact(randomFact);
    }, 3000);

    return () => clearInterval(factInterval);
  }, []);

  // Update remaining time every second
  useEffect(() => {
    if (status === 'completed') return;
    
    const timeInterval = setInterval(() => {
      // Force re-render to update time display
      setLastProgressUpdate(prev => prev);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [status]);

  // Set initial fact
  useEffect(() => {
    setCurrentFact(legalFacts[0]);
  }, []);

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

  if (error) {
    return (
      <div className="processing-error">
        <motion.div
          className="error-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <div className="error-actions">
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="processing-screen">
      <motion.div
        className="processing-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Column - Progress and Status */}
        <div className="processing-left-column">
          {/* Progress Circle */}
          <motion.div className="progress-circle-container" variants={itemVariants}>
            <div className="progress-circle">
              <svg className="progress-ring" width="200" height="200">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle
                  className="progress-ring-bg"
                  cx="100"
                  cy="100"
                  r="80"
                  strokeWidth="8"
                />
                <motion.circle
                  className="progress-ring-fill"
                  cx="100"
                  cy="100"
                  r="80"
                  strokeWidth="8"
                  stroke="url(#progressGradient)"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 502.4" }}
                  animate={{ 
                    strokeDasharray: `${(smoothProgress / 100) * 502.4} 502.4`
                  }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div className="progress-center">
                {status !== 'completed' ? (
                  <motion.div
                    className="processing-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <FiZap size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    className="completion-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <FiCheck size={32} />
                  </motion.div>
                )}
                <div className="progress-text">
                  <span className="progress-percentage">{Math.round(smoothProgress)}%</span>
                  <span className="progress-label">Complete</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div className="processing-title" variants={itemVariants}>
            <h1>Processing Document</h1>
            <p>{message}</p>
            {status !== 'completed' && (
              <div className="time-remaining">
                <span className="time-label">Estimated time remaining:</span>
                <span className="time-value">{formatTime(calculateRemainingTime())}</span>
              </div>
            )}
            {status !== 'completed' && (
              <div className="step-progress">
                <div className="step-progress-bar">
                  <div 
                    className="step-progress-fill"
                    style={{ 
                      width: `${((Date.now() - lastProgressUpdate) / (stepDurations[getCurrentStep()] * 1000)) * 100}%` 
                    }}
                  />
                </div>
                <span className="step-progress-text">Step {getCurrentStep() + 1} of {processingSteps.length}</span>
              </div>
            )}
          </motion.div>

          {/* Document Info */}
          <motion.div className="document-info" variants={itemVariants}>
            <div className="doc-id">
              <span>ID: {docId}</span>
            </div>
            <div className="status-badge">
              <span>{status}</span>
            </div>
          </motion.div>

          {/* Completion Message */}
          {status === 'completed' && (
            <motion.div 
              className="completion-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FiCheck size={32} />
              <span>Analysis Complete! Redirecting...</span>
            </motion.div>
          )}

          {/* Cancel Button */}
          {status !== 'completed' && (
            <motion.div className="cancel-button" variants={itemVariants}>
              <button
                className="cancel-btn"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column - Steps and Facts */}
        <div className="processing-right-column">
          {/* Legal Facts */}
          {currentFact && (
            <motion.div 
              className="legal-facts-container"
              variants={itemVariants}
              key={currentFact}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="legal-fact-card">
                <div className="fact-icon">⚖️</div>
                <p className="fact-text">{currentFact}</p>
              </div>
            </motion.div>
          )}

          {/* Steps */}
          <motion.div className="steps-container" variants={itemVariants}>
            <h3>Processing Steps</h3>
            <div className="steps-list">
              {processingSteps.map((step, index) => {
                const stepStatus = getStepStatus(index);
                const IconComponent = step.icon;
                const isActive = stepStatus === 'active';
                const isCompleted = stepStatus === 'completed';
                
                return (
                  <motion.div
                    key={step.id}
                    className={`step-item ${stepStatus}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="step-icon-container">
                      <div className={`step-icon ${stepStatus}`}>
                        {isCompleted && <FiCheck size={18} />}
                        {isActive && <FiZap size={18} />}
                        {stepStatus === 'pending' && <IconComponent size={18} />}
                      </div>
                      {index < processingSteps.length - 1 && (
                        <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                      )}
                    </div>
                    <div className="step-content">
                      <span className="step-label">{step.label}</span>
                      {isActive && (
                        <motion.div 
                          className="active-indicator"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <span className="active-text">Processing...</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Upload More Button */}
          <motion.div className="upload-more-container" variants={itemVariants}>
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="upload-more-btn"
            >
              <FiUpload size={16} />
              Upload More Documents
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingScreen; 