"""
Configuration file for SimplyLegal
Set your API keys and other settings here
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Flask Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "28d9c9b97744dca34325ffa234260e7075c852181aa7012daf59feb0356c5514")
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"

# File Upload Configuration
UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed"

# Data Storage Configuration
DATA_DIR = "data"
SUMMARIES_FILE = "summaries.json"

# FAISS Configuration
FAISS_INDEX_FILE = "faiss_index.bin"
FAISS_METADATA_FILE = "faiss_metadata.pkl"

# Logging Configuration
LOG_LEVEL = "INFO"
