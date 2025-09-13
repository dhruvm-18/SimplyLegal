#!/usr/bin/env python3
"""
Configuration file for SimplyLegal
"""

import os

# API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# File Upload Configuration
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Flask Configuration
FLASK_DEBUG = os.getenv('FLASK_ENV') != 'production'

# Directory Configuration
DATA_DIR = 'data'
SUMMARIES_FILE = 'summaries.json'