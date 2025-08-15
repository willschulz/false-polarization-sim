#!/usr/bin/env python3
"""
Simple HTTP server for the Self-Censorship Visualization Dashboard
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# Configuration
PORT = 8091
DIRECTORY = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with better MIME types and CORS headers"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """Improve MIME type guessing for modern web assets"""
        # Handle specific file types directly
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.png'):
            return 'image/png'
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            return 'image/jpeg'
        elif path.endswith('.gif'):
            return 'image/gif'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        else:
            # Fall back to parent implementation for other types
            return super().guess_type(path)

def main():
    """Start the development server"""
    
    # Change to the project directory
    os.chdir(DIRECTORY)
    
    # Check if index.html exists
    if not Path('index.html').exists():
        print("Error: index.html not found in the current directory")
        print(f"Current directory: {DIRECTORY}")
        sys.exit(1)
    
    # Create server - bind to all interfaces for public access
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
        server_url_local = f"http://localhost:{PORT}"
        server_url_public = f"http://0.0.0.0:{PORT}"
        
        print(f"🚀 Self-Censorship Visualization Dashboard")
        print(f"📍 Local access: {server_url_local}")
        print(f"🌐 Public access: http://YOUR_SERVER_IP:{PORT}")
        print(f"📁 Directory: {DIRECTORY}")
        print(f"⏹️  Press Ctrl+C to stop the server")
        print()
        
        # Optionally open browser automatically (local only)
        try:
            webbrowser.open(server_url_local)
            print("✅ Browser opened automatically")
        except Exception as e:
            print(f"⚠️  Could not open browser automatically: {e}")
        
        print()
        
        # Start serving
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
