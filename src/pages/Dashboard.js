import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';
import Button from '../components/Button';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import DocumentCard from '../components/DocumentCard';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { FiUpload, FiPlus, FiSearch, FiFilter, FiLogOut, FiUser, FiFileText, FiTrash2, FiDroplet, FiImage, FiType, FiEdit3, FiX, FiSave } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    documentId: null,
    documentName: '',
    isLoading: false
  });

  const [customizationModal, setCustomizationModal] = useState({
    isOpen: false,
    document: null,
    editingCustomization: null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await apiService.getUserDocuments();
      console.log('Dashboard: Loaded documents with summary data:', docs);
      
      // Log customization data for debugging
      docs.forEach(doc => {
        if (doc.customization || doc.custom_name || doc.theme || doc.font || doc.logo_path) {
          console.log(`Document ${doc.id} customization:`, {
            custom_name: doc.custom_name,
            theme: doc.theme,
            font: doc.font,
            logo_path: doc.logo_path,
            customization: doc.customization
          });
        }
      });
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (docId) => {
    navigate(`/document/${docId}`);
  };

  const handleUploadSuccess = async (docId, customization = null) => {
    try {
      setUploading(true);
      setShowUpload(false);
      
      // Add to documents list with customization info
      const newDoc = {
        id: docId,
        name: customization?.name || 'Document being processed...',
        status: 'processing',
        uploadedAt: new Date().toISOString(),
        summary: 'Analysis in progress...',
        riskLevel: 'pending',
        customization: customization
      };
      
      setDocuments(prev => [newDoc, ...prev]);
      
      // Navigate to processing screen
      navigate(`/processing/${docId}`);
      
    } catch (error) {
      console.error('Error handling upload success:', error);
      alert('Error processing document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteDocument = async (docId, event) => {
    event.stopPropagation(); // Prevent document click
    
    // Find the document to get its name
    const document = documents.find(doc => doc.id === docId);
    
    // Open delete confirmation modal
    setDeleteModal({
      isOpen: true,
      documentId: docId,
      documentName: document?.name || 'this document',
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      
      await apiService.deleteDocument(deleteModal.documentId);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== deleteModal.documentId));
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        documentId: null,
        documentName: '',
        isLoading: false
      });
      
      // Show success message (you could replace this with a toast notification)
      console.log('Document deleted successfully');
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
      
      // Close modal on error
      setDeleteModal({
        isOpen: false,
        documentId: null,
        documentName: '',
        isLoading: false
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      documentId: null,
      documentName: '',
      isLoading: false
    });
  };

  const handleOpenCustomization = (document) => {
    setCustomizationModal({
      isOpen: true,
      document: document,
      editingCustomization: {
        custom_name: document.custom_name || document.name,
        theme: document.theme || 'default',
        font: document.font || 'inter'
      }
    });
  };

  const handleCloseCustomization = () => {
    setCustomizationModal({
      isOpen: false,
      document: null,
      editingCustomization: null
    });
  };

  const handleSaveCustomization = async () => {
    try {
      const { document, editingCustomization } = customizationModal;
      
      // Update the document in the backend
      const response = await apiService.updateDocumentCustomization(document.id, editingCustomization);
      
      // Update the local state
      setDocuments(prev => prev.map(doc => {
        if (doc.id === document.id) {
          return {
            ...doc,
            custom_name: editingCustomization.custom_name,
            theme: editingCustomization.theme,
            font: editingCustomization.font,
            customization: {
              ...doc.customization,
              name: editingCustomization.custom_name,
              theme: editingCustomization.theme,
              font: editingCustomization.font
            }
          };
        }
        return doc;
      }));
      
      console.log('Customization updated for document:', document.id, editingCustomization);
      handleCloseCustomization();
    } catch (error) {
      console.error('Error updating customization:', error);
      alert('Error updating customization. Please try again.');
    }
  };

  const handleUpdateCustomization = async (docId, customization) => {
    try {
      // Update the document in the backend
      const response = await apiService.updateDocumentCustomization(docId, customization);
      
      // Update the local state
      setDocuments(prev => prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            custom_name: customization.custom_name,
            theme: customization.theme,
            font: customization.font,
            customization: {
              ...doc.customization,
              name: customization.custom_name,
              theme: customization.theme,
              font: customization.font
            }
          };
        }
        return doc;
      }));
      
      console.log('Customization updated for document:', docId, customization);
    } catch (error) {
      console.error('Error updating customization:', error);
      alert('Error updating customization. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p>Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <motion.header 
        className="dashboard-header"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="header-content">
          <div className="header-left">
            <h1>SimplyLegal</h1>
            <p>AI-powered document review and risk assessment</p>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <FiUser size={20} />
              <span>{user?.name || user?.email}</span>
            </div>
            <Button
              variant="secondary"
              onClick={handleLogout}
              icon={<FiLogOut size={16} />}
            >
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="dashboard-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Upload Section */}
        <motion.section 
          className="upload-section"
          variants={itemVariants}
        >
          <Card className="upload-card">
            <div className="upload-content">
              <div className="upload-icon">
                <FiUpload size={32} />
              </div>
              <h2>Upload New Document</h2>
              <p>Upload and customize your legal documents with AI-powered analysis</p>
              <div className="upload-features">
                <div className="feature-item">
                  <FiFileText size={16} />
                  <span>Document Preview</span>
                </div>
                <div className="feature-item">
                  <FiDroplet size={16} />
                  <span>Custom Themes</span>
                </div>
                <div className="feature-item">
                  <FiImage size={16} />
                  <span>Logo Support</span>
                </div>
                <div className="feature-item">
                  <FiType size={16} />
                  <span>Custom Names</span>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowUpload(true)}
                icon={<FiPlus size={18} />}
                disabled={uploading}
                className="upload-button"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </Card>
        </motion.section>

        {/* Search and Filter */}
        <motion.section 
          className="search-filter-section"
          variants={itemVariants}
        >
          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch size={20} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-box">
              <FiFilter size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Documents</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Documents Grid */}
        <motion.section 
          className="documents-section"
          variants={itemVariants}
        >
          <div className="documents-header">
            <h2>Your Documents</h2>
            <span className="document-count">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <Card className="empty-state">
              <div className="empty-content">
                <FiFileText size={48} />
                <h3>No documents found</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Upload your first document to get started with AI-powered analysis'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button
                    variant="primary"
                    onClick={() => setShowUpload(true)}
                    icon={<FiPlus size={18} />}
                  >
                    Upload Document
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="documents-grid">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={() => handleDocumentClick(doc.id)}
                  onDelete={handleDeleteDocument}
                  onOpenCustomization={handleOpenCustomization}
                />
              ))}
            </div>
          )}
        </motion.section>
      </motion.main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <FileUpload
            onClose={() => setShowUpload(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        documentName={deleteModal.documentName}
        isLoading={deleteModal.isLoading}
      />

      {/* Customization Overlay Modal */}
      <AnimatePresence>
        {customizationModal.isOpen && (
          <motion.div
            className="customization-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseCustomization();
              }
            }}
          >
            <motion.div
              className="customization-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="modal-header">
                <div className="header-content">
                  <h2>Customize Document</h2>
                  <p>Update the appearance and settings for "{customizationModal.document?.custom_name || customizationModal.document?.name}"</p>
                </div>
                <button 
                  className="close-btn"
                  onClick={handleCloseCustomization}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-content">
                <div className="customization-form">
                  <div className="form-group">
                    <label htmlFor="customName">
                      <FiType />
                      Document Name
                    </label>
                    <input
                      id="customName"
                      type="text"
                      value={customizationModal.editingCustomization?.custom_name || ''}
                      onChange={(e) => setCustomizationModal(prev => ({
                        ...prev,
                        editingCustomization: {
                          ...prev.editingCustomization,
                          custom_name: e.target.value
                        }
                      }))}
                      placeholder="Enter custom document name"
                      className="custom-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="themeSelect">
                      <FiDroplet />
                      Color Theme
                    </label>
                    <select
                      id="themeSelect"
                      value={customizationModal.editingCustomization?.theme || 'default'}
                      onChange={(e) => setCustomizationModal(prev => ({
                        ...prev,
                        editingCustomization: {
                          ...prev.editingCustomization,
                          theme: e.target.value
                        }
                      }))}
                      className="custom-select"
                    >
                      <option value="default">Default</option>
                      <option value="professional">Professional</option>
                      <option value="modern">Modern</option>
                      <option value="corporate">Corporate</option>
                      <option value="elegant">Elegant</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fontSelect">
                      <FiType />
                      Font Family
                    </label>
                    <select
                      id="fontSelect"
                      value={customizationModal.editingCustomization?.font || 'inter'}
                      onChange={(e) => setCustomizationModal(prev => ({
                        ...prev,
                        editingCustomization: {
                          ...prev.editingCustomization,
                          font: e.target.value
                        }
                      }))}
                      className="custom-select"
                    >
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="opensans">Open Sans</option>
                      <option value="poppins">Poppins</option>
                      <option value="montserrat">Montserrat</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={handleCloseCustomization}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleSaveCustomization}
                >
                  <FiSave size={16} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard; 