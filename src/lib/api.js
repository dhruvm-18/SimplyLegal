import axios from 'axios';

// API base URL (replace with your actual backend URL)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Upload document directly
  uploadDocument: async (formData) => {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get signed URL for file upload
  getSignedUrl: async (fileName, fileType) => {
    const response = await api.post('/api/signed-url', {
      fileName,
      fileType,
    });
    return response.data;
  },

  // Notify backend about upload
  notifyUpload: async (fileUrl, fileName) => {
    const response = await api.post('/api/notify-upload', {
      fileUrl,
      fileName,
    });
    return response.data;
  },

  // Get document processing status
  getDocumentStatus: async (docId) => {
    const response = await api.get(`/api/status?docId=${docId}`);
    return response.data;
  },

  // Get document details with Gemini analysis
  getDocumentDetails: async (docId) => {
    const response = await api.get(`/api/document/${docId}`);
    return response.data;
  },

  // Ask question about document using Gemini
  askQuestion: async (docId, question) => {
    const response = await api.post('/api/qna', {
      docId,
      question,
    });
    return response.data;
  },

  // Export briefing PDF
  exportBriefing: async (docId) => {
    const response = await api.post('/api/export', {
      docId,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get user's documents
  getUserDocuments: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/healthz');
    return response.data;
  },

  // FAISS Search
  searchDocuments: async (query, k = 5) => {
    const response = await api.post('/api/search', {
      query,
      k,
    });
    return response.data;
  },

  // FAISS Stats
  getFaissStats: async () => {
    const response = await api.get('/api/faiss/stats');
    return response.data;
  },

  // Get Document Chunks
  getDocumentChunks: async (docId) => {
    const response = await api.get(`/api/faiss/document/${docId}/chunks`);
    return response.data;
  },

  // Data Statistics
  getDataStats: async () => {
    const response = await api.get('/api/data/stats');
    return response.data;
  },

  // Delete Document
  deleteDocument: async (docId) => {
    const response = await api.delete(`/api/document/${docId}`);
    return response.data;
  },

  // Get Deep Analysis
  getDeepAnalysis: async (docId) => {
    const response = await api.get(`/api/deep-analysis/${docId}`);
    return response.data;
  },

  // Get All Deep Analysis (for debugging)
  getAllDeepAnalysis: async () => {
    const response = await api.get('/api/deep-analysis');
    return response.data;
  },



  // Get Action Items
  getActionItems: async (docId) => {
    const response = await api.get(`/api/action-items/${docId}`);
    return response.data;
  },

  // Get All Action Items (for debugging)
  getAllActionItems: async () => {
    const response = await api.get('/api/action-items');
    return response.data;
  },

  // Update Action Item Status
  updateActionItemStatus: async (docId, actionId, status, completed) => {
    const response = await api.put(`/api/action-items/${docId}/${actionId}/status`, {
      status,
      completed
    });
    return response.data;
  },

  // Add Note to Action Item
  addActionItemNote: async (docId, actionId, note) => {
    const response = await api.post(`/api/action-items/${docId}/${actionId}/notes`, {
      note
    });
    return response.data;
  },

  // Get Action Items Summary
  getActionItemsSummary: async () => {
    const response = await api.get('/api/action-items/summary');
    return response.data;
  },

  // Get High Priority Actions
  getHighPriorityActions: async (docId = null) => {
    const url = docId ? `/api/action-items/high-priority?doc_id=${docId}` : '/api/action-items/high-priority';
    const response = await api.get(url);
    return response.data;
  },

  // Get Overdue Actions
  getOverdueActions: async (docId = null) => {
    const url = docId ? `/api/action-items/overdue?doc_id=${docId}` : '/api/action-items/overdue';
    const response = await api.get(url);
    return response.data;
  },

  // Get Upcoming Deadlines
  getUpcomingDeadlines: async (days = 30, docId = null) => {
    const url = docId ? `/api/action-items/upcoming?days=${days}&doc_id=${docId}` : `/api/action-items/upcoming?days=${days}`;
    const response = await api.get(url);
    return response.data;
  },
};

// For development - simulate API responses with realistic data structure
export const mockApiService = {
  // Simulate document upload and processing
  uploadDocument: async (file) => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const docId = `doc_${Date.now()}`;
    return {
      docId,
      status: 'processing',
      message: 'Document uploaded successfully. Analysis in progress...'
    };
  },

  // Simulate document status check
  getDocumentStatus: async (docId) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate different processing stages
    const stages = ['uploading', 'processing', 'analyzing', 'completed'];
    const randomStage = stages[Math.floor(Math.random() * stages.length)];
    
    return {
      docId,
      status: randomStage,
      progress: randomStage === 'completed' ? 100 : Math.floor(Math.random() * 90) + 10,
      message: `Document ${randomStage}...`
    };
  },

  // Simulate Gemini-powered document analysis
  getDocumentDetails: async (docId) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // This would be replaced with actual Gemini API call
    return {
      id: docId,
      name: `Document_${docId}.pdf`,
      status: 'completed',
      uploadedAt: new Date().toISOString(),
      analysis: {
        summary: "This document appears to be a legal contract requiring careful review of terms and conditions.",
        clauses: [
          {
            id: 'clause-1',
            title: 'Terms and Conditions',
            plainEnglish: 'This section outlines the basic terms of the agreement between parties.',
            riskLevel: 'medium',
            riskReasons: ['Standard terms', 'Requires legal review'],
            actions: [
              { task: 'Review terms thoroughly', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
            ],
            evidence: [{ start: 0, end: 200 }]
          }
        ],
        risks: [
          {
            id: 'risk-1',
            title: 'Standard Legal Terms',
            level: 'medium',
            description: 'Document contains standard legal language that requires professional review.',
            clauseId: 'clause-1'
          }
        ],
        checklist: [
          {
            id: 'task-1',
            task: 'Review document with legal counsel',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            completed: false,
            priority: 'high'
          }
        ]
      }
    };
  },

  // Simulate Gemini-powered Q&A
  askQuestion: async (docId, question) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // This would be replaced with actual Gemini API call
    return {
      answer: `Based on the analysis of document ${docId}, ${question.toLowerCase().includes('risk') ? 'the document contains several areas that require attention.' : 'the document appears to be a standard legal agreement.'}`,
      citations: [
        {
          clauseId: 'clause-1',
          page: 1,
          excerpt: 'Relevant section from the document...'
        }
      ],
      confidence: 0.85
    };
  },

  // Simulate user documents list
  getUserDocuments: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'doc_1',
        name: 'Employment_Contract.pdf',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Employment agreement with standard terms',
        riskLevel: 'medium',
      },
      {
        id: 'doc_2',
        name: 'Service_Agreement.pdf',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'IT services contract with detailed scope',
        riskLevel: 'low',
      }
    ];
  }
};

export default api; 