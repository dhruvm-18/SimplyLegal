#!/usr/bin/env python3
"""
SimplyLegal Backend - Railway Production Version
A comprehensive Flask backend for legal document analysis using Google Gemini AI
Modified to serve React frontend in production
"""

import os
import json
import uuid
import logging
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded environment variables from .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment variables")
except Exception as e:
    print(f"⚠️  Could not load .env file: {e}")

import flask
from flask import Flask, request, jsonify, send_file, abort, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import the original backend functionality
import sys
sys.path.append('.')

# Import all the original backend code
exec(open('backend.py').read().replace('if __name__ == "__main__":', 'if False:'))

# Add route to serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React frontend"""
    static_folder = os.path.join(os.getcwd(), 'static')
    
    # If path is empty or doesn't exist, serve index.html
    if path != "" and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    else:
        return send_from_directory(static_folder, 'index.html')

# Override the main execution
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    
    print(f"🚀 Starting SimplyLegal Backend on port {port}")
    print(f"📁 Static files served from: {os.path.join(os.getcwd(), 'static')}")
    print(f"🔧 Debug mode: {FLASK_DEBUG}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,  # Always False in production
        threaded=True
    )