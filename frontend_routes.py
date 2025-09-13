"""
Frontend serving routes for production deployment
Add this to your backend.py file to serve the React frontend
"""

import os
from flask import send_from_directory, send_file

def add_frontend_routes(app):
    """Add routes to serve React frontend in production"""
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        """Serve React frontend"""
        static_folder = os.path.join(os.getcwd(), 'static')
        
        # Check if it's an API route - don't serve frontend for these
        if path.startswith('api/') or path.startswith('healthz'):
            return abort(404)
        
        # If path is empty or doesn't exist, serve index.html
        if path != "" and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        else:
            # Serve index.html for all other routes (React Router will handle routing)
            return send_from_directory(static_folder, 'index.html')

    @app.route('/static/<path:filename>')
    def serve_static_files(filename):
        """Serve static files (CSS, JS, images, etc.)"""
        static_folder = os.path.join(os.getcwd(), 'static', 'static')
        return send_from_directory(static_folder, filename)

# Add the routes to your app
if 'app' in globals():
    add_frontend_routes(app)