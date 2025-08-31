import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Button from './Button';
import Card from './Card';
import { 
  FiUpload, 
  FiX, 
  FiFile, 
  FiCheck, 
  FiAlertCircle, 
  FiEdit3, 
  FiEye, 
  FiEyeOff,
  FiImage,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiSettings,
  FiDroplet,
  FiType
} from 'react-icons/fi';
import { apiService } from '../lib/api';
import './FileUpload.css';

const FileUpload = ({ onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [customName, setCustomName] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedFont, setSelectedFont] = useState('inter');
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Theme configurations
  const themes = {
    default: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#60A5FA',
      background: '#F8FAFC',
      surface: '#FFFFFF'
    },
    professional: {
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#6B7280',
      background: '#F9FAFB',
      surface: '#FFFFFF'
    },
    modern: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
      background: '#FAF5FF',
      surface: '#FFFFFF'
    },
    corporate: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10B981',
      background: '#F0FDF4',
      surface: '#FFFFFF'
    },
    elegant: {
      primary: '#DC2626',
      secondary: '#B91C1C',
      accent: '#EF4444',
      background: '#FEF2F2',
      surface: '#FFFFFF'
    }
  };

  const fonts = [
    { id: 'inter', name: 'Inter', class: 'font-inter' },
    { id: 'roboto', name: 'Roboto', class: 'font-roboto' },
    { id: 'opensans', name: 'Open Sans', class: 'font-opensans' },
    { id: 'poppins', name: 'Poppins', class: 'font-poppins' },
    { id: 'montserrat', name: 'Montserrat', class: 'font-montserrat' }
  ];

  const generateFilePreview = (file) => {
    console.log('Generating preview for file:', file.name, file.type);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Image preview generated');
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      console.log('PDF preview set');
      setFilePreview('/pdf-preview.svg');
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.type === 'application/msword') {
      console.log('Word document preview set');
      setFilePreview('/word-preview.svg');
    } else {
      console.log('Generic document preview set');
      setFilePreview('/document-preview.svg');
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, Word document, or image file (JPEG, PNG)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setCustomName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for custom name
    generateFilePreview(file);
    setUploadError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customName', customName || selectedFile.name);
      formData.append('theme', selectedTheme);
      formData.append('font', selectedFont);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to backend
      const response = await apiService.uploadDocument(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Call success callback with document ID and customization data
      onSuccess(response.docId, response.customization);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.error || 'Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setCustomName('');
    setUploadError(null);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
    hidden: { opacity: 0, scale: 0.9, y: 20 },
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

  return (
    <AnimatePresence>
      <motion.div
        className="file-upload-overlay"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="file-upload-modal"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          style={{
            '--theme-primary': themes[selectedTheme].primary,
            '--theme-secondary': themes[selectedTheme].secondary,
            '--theme-accent': themes[selectedTheme].accent,
            '--theme-background': themes[selectedTheme].background,
            '--theme-surface': themes[selectedTheme].surface
          }}
        >
          <div className="modal-header">
            <div className="header-content">
              <h2>Upload Document</h2>
              <p>Upload and customize your legal document</p>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={onClose}
              icon={<FiX />}
              disabled={uploading}
            />
          </div>

          <div className="modal-content">
            {!uploading ? (
              <>
                {!selectedFile ? (
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                      <motion.div
                        className="upload-icon"
                        animate={{
                          scale: isDragActive ? 1.1 : 1,
                          rotate: isDragActive ? 5 : 0
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiUpload />
                      </motion.div>
                      <h3>
                        {isDragActive 
                          ? 'Drop your file here' 
                          : 'Drag & drop your document here'
                        }
                      </h3>
                      <p>or click to browse</p>
                                        <div className="file-types">
                    <span>Supported: PDF, Word, JPEG, PNG</span>
                    <span>Max size: 10MB</span>
                  </div>
                    </div>
                  </div>
                ) : (
                  <div className="file-preview-section">
                    <div className="preview-header">
                      <h3>Document Preview</h3>
                      <div className="preview-controls">
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setShowPreview(!showPreview)}
                          icon={showPreview ? <FiEyeOff /> : <FiEye />}
                        >
                          {showPreview ? 'Hide' : 'Show'} Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setShowCustomization(!showCustomization)}
                          icon={<FiSettings />}
                        >
                          Customize
                        </Button>
                      </div>
                    </div>

                    {showPreview && (
                      <div className="file-preview">
                        <div className="preview-container">
                          {filePreview ? (
                            <img 
                              src={filePreview} 
                              alt="Document preview" 
                              className="preview-image"
                              onLoad={() => console.log('Preview image loaded successfully')}
                              onError={(e) => console.error('Preview image failed to load:', e)}
                            />
                          ) : (
                            <div className="preview-placeholder">
                              <FiFile size={48} />
                              <p>Preview not available</p>
                            </div>
                          )}
                          <div className="file-info">
                            <div className="file-icon">
                              {selectedFile.type === 'application/pdf' ? <FiFileText /> : 
                               selectedFile.type.startsWith('image/') ? <FiImage /> :
                               selectedFile.type.includes('word') || selectedFile.type.includes('document') ? <FiFileText /> :
                               <FiFile />}
                            </div>
                            <div className="file-details">
                              <h4>{selectedFile.name}</h4>
                              <p>{formatFileSize(selectedFile.size)}</p>
                              <p>{selectedFile.type}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="customization-section">
                      <div className="customization-row">
                        <div className="input-group">
                          <label htmlFor="customName">
                            <FiType />
                            Document Name
                          </label>
                          <input
                            id="customName"
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Enter custom document name"
                            className="custom-input"
                          />
                        </div>
                      </div>

                      {showCustomization && (
                        <motion.div
                          className="advanced-customization"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="customization-grid">
                            <div className="input-group">
                              <label htmlFor="logoUpload">
                                <FiImage />
                                Company Logo
                              </label>
                              <div className="logo-upload">
                                {logoPreview ? (
                                  <div className="logo-preview">
                                    <img src={logoPreview} alt="Logo preview" />
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={handleRemoveLogo}
                                      icon={<FiTrash2 />}
                                    />
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => logoInputRef.current?.click()}
                                    icon={<FiUpload />}
                                  >
                                    Upload Logo
                                  </Button>
                                )}
                                <input
                                  ref={logoInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  style={{ display: 'none' }}
                                />
                              </div>
                            </div>

                            <div className="input-group">
                              <label htmlFor="themeSelect">
                                <FiDroplet />
                                Color Theme
                              </label>
                              <select
                                id="themeSelect"
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="custom-select"
                              >
                                {Object.keys(themes).map(theme => (
                                  <option key={theme} value={theme}>
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="input-group">
                              <label htmlFor="fontSelect">
                                <FiType />
                                Font Family
                              </label>
                              <select
                                id="fontSelect"
                                value={selectedFont}
                                onChange={(e) => setSelectedFont(e.target.value)}
                                className="custom-select"
                              >
                                {fonts.map(font => (
                                  <option key={font.id} value={font.id}>
                                    {font.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="theme-preview">
                            <h4>Theme Preview</h4>
                            <div className="theme-colors">
                              {Object.entries(themes[selectedTheme]).map(([key, color]) => (
                                <div key={key} className="color-swatch">
                                  <div 
                                    className="color-preview" 
                                    style={{ backgroundColor: color }}
                                  />
                                  <span>{key}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="upload-progress">
                <div className="progress-icon">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FiUpload />
                  </motion.div>
                </div>
                <h3>Uploading document...</h3>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p>{uploadProgress}% complete</p>
              </div>
            )}

            {uploadError && (
              <motion.div
                className="upload-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiAlertCircle />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </div>

          <div className="modal-footer">
            {selectedFile && !uploading && (
              <Button
                variant="secondary"
                onClick={handleRemoveFile}
                icon={<FiTrash2 />}
              >
                Remove File
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            {selectedFile && !uploading && (
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploading}
                icon={<FiUpload />}
              >
                Upload Document
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUpload; 