# SimplyLegal Backend

A comprehensive Flask backend for legal document analysis using Google Gemini AI. This backend handles file uploads, document processing, text extraction, and AI-powered analysis.

## Features

- **File Upload & Processing**: Supports PDF, DOCX, JPEG, PNG files
- **Text Extraction**: OCR for images, PDF text extraction, DOCX parsing
- **AI Analysis**: Google Gemini integration for document analysis
- **Real-time Processing**: Async document processing with status updates
- **Q&A System**: Ask questions about uploaded documents
- **Export Functionality**: Generate document briefings
- **RESTful API**: Complete API for frontend integration

## Prerequisites

- Python 3.8+
- Google Gemini API key
- Tesseract OCR (for image processing)

### Installing Tesseract OCR

**Windows:**
```bash
# Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR
```

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

## Installation

1. **Clone the repository** (if not already done)
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   SECRET_KEY=your_secret_key_here
   ```

4. **Get Google Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

## Running the Backend

### Development Mode
```bash
python backend.py
```

The server will start on `http://localhost:8080`

### Production Mode
```bash
# Using Gunicorn (recommended for production)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8080 backend:app
```

## API Endpoints

### Health Check
- `GET /healthz` - Check backend health and Gemini configuration

### File Upload
- `POST /api/upload` - Upload document for analysis
  - Body: Form data with 'file' field
  - Returns: Document ID and initial status

### Document Status
- `GET /api/status?docId=<id>` - Get processing status
  - Returns: Current status and progress

### Document Analysis
- `GET /api/document/<doc_id>` - Get complete analysis
  - Returns: Full document analysis with Gemini insights

### Q&A System
- `POST /api/qna` - Ask questions about document
  - Body: `{"docId": "...", "question": "..."}`
  - Returns: AI-generated answer with citations

### Document Management
- `GET /api/documents` - List all documents
- `POST /api/export` - Export document briefing
  - Body: `{"docId": "..."}`

### S3 Integration (Placeholder)
- `POST /api/signed-url` - Get signed URL for direct upload
- `POST /api/notify-upload` - Notify backend of completed upload

## File Processing Pipeline

1. **Upload**: File validation and storage
2. **Text Extraction**: 
   - PDF: PyMuPDF text extraction
   - Images: Tesseract OCR
   - DOCX: python-docx parsing
3. **AI Analysis**: Gemini AI processes extracted text
4. **Results**: Structured analysis with risks, clauses, and recommendations

## Supported File Types

- **PDF** (.pdf) - Text extraction and OCR for scanned PDFs
- **Images** (.jpg, .jpeg, .png) - OCR text extraction
- **Word Documents** (.docx) - Direct text extraction

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini API key
- `SECRET_KEY`: Flask secret key for sessions
- `MAX_CONTENT_LENGTH`: Maximum file size (default: 10MB)

### File Storage
- Uploads: `./uploads/` directory
- Processed: `./processed/` directory
- Temporary files are cleaned up automatically

## Error Handling

The backend includes comprehensive error handling:
- File validation errors
- Processing failures
- API rate limiting
- Gemini API errors
- Network timeouts

## Security Features

- File type validation
- File size limits
- Secure filename handling
- CORS configuration
- Input sanitization

## Development

### Adding New File Types
1. Add MIME type to `supported_formats` in `DocumentProcessor`
2. Implement extraction method
3. Update validation in upload endpoint

### Extending AI Analysis
1. Modify prompts in `GeminiAnalyzer`
2. Add new analysis fields
3. Update response parsing

### Database Integration
Replace in-memory storage with:
- SQLite (for development)
- PostgreSQL (for production)
- Redis (for caching)

## Troubleshooting

### Common Issues

1. **Tesseract not found:**
   ```bash
   # Install tesseract and ensure it's in PATH
   # Windows: Add C:\Program Files\Tesseract-OCR to PATH
   ```

2. **Gemini API errors:**
   - Check API key is correct
   - Verify API quota and limits
   - Check network connectivity

3. **File upload failures:**
   - Check file size limits
   - Verify supported file types
   - Ensure upload directory permissions

4. **Processing stuck:**
   - Check logs for errors
   - Verify text extraction is working
   - Monitor Gemini API responses

### Logs
Enable debug logging by setting log level:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Performance Optimization

- **Async Processing**: Documents processed in background threads
- **File Size Limits**: Configurable upload limits
- **Caching**: Consider Redis for analysis results
- **Load Balancing**: Use Gunicorn with multiple workers

## Production Deployment

1. **Use Gunicorn:**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8080 backend:app
   ```

2. **Set up reverse proxy (Nginx):**
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

3. **Environment variables:**
   - Use proper secret management
   - Set production API keys
   - Configure logging

4. **Monitoring:**
   - Health check endpoints
   - Error tracking
   - Performance metrics

## License

This project is part of the SimplyLegal application. 