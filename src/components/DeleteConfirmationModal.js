import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import Button from './Button';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  documentName = 'this document',
  isLoading = false 
}) => {
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="delete-modal-overlay"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
        >
          <motion.div
            className="delete-modal-content"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="delete-modal-header">
              <div className="delete-modal-icon">
                <FiAlertTriangle size={32} />
              </div>
            </div>

            <div className="delete-modal-body">
              <h2>Delete Document</h2>
              <p>
                Are you sure you want to delete <strong>"{documentName}"</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone. All analysis data, action items, and related information will be permanently removed.
              </p>
            </div>

            <div className="delete-modal-footer">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirm}
                loading={isLoading}
                icon={<FiTrash2 size={16} />}
                fullWidth
              >
                {isLoading ? 'Deleting...' : 'Delete Document'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal; 