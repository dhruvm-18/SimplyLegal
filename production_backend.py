#!/usr/bin/env python3
"""
Production Backend for Railway Deployment
This file imports your existing backend and adds frontend serving capabilities
"""

import os
import sys
from flask import send_from_directory, abort

# Import your existing backend
from backend import app

# Add frontend serving routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React frontend for all non-API routes"""
    static_folder = os.path.join(os.getcwd(), 'static')
    
    # Don't serve frontend for API routes
    api_routes = ['api/', 'healthz', 'upload', 'documents', 'analyze', 'delete']
    if any(path.startswith(route) for route in api_routes):
        abort(404)
    
    # Serve static files if they exist
    if path and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    
    # Serve index.html for all other routes (React Router handles client-side routing)
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder, 'index.html')
    else:
        return "Frontend not built. Please run 'npm run build' first.", 404

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"🚀 Starting SimplyLegal on port {port}")
    print(f"📁 Serving static files from: {os.path.join(os.getcwd(), 'static')}")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )