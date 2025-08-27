from flask import Flask, jsonify
from flask_cors import CORS
import logging
import os
from datetime import datetime

# Import configuration
from config import config

# Import database
from database.db import init_db

# Import model manager
from services.model_manager import init_model_manager

# Import routes
from routes.amd_routes import amd_bp
from routes.glaucoma_routes import glaucoma_bp
from routes.biomarker_routes import biomarkers_bp
from routes.dr_routes import dr_bp
from routes.api_routes import api_bp

def setup_logging(app):
    """Setup application logging."""
    log_level = app.config.get('LOG_LEVEL', 'INFO')
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, 'app.log')),
            logging.StreamHandler()
        ]
    )
    
    # Set specific logger levels
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('PIL').setLevel(logging.WARNING)

def create_app(config_name='default'):
    """Application factory pattern."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Setup logging
    setup_logging(app)
    
    # Initialize CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Create upload directory
    upload_dir = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Initialize database
    init_db(app)
    
    # Initialize model manager
    init_model_manager(
        models_dir=app.config['MODELS_DIR'],
        device='cpu'  # Use CPU for demo, change to 'cuda' if GPU available
    )
    
    # Register blueprints
    app.register_blueprint(amd_bp)
    app.register_blueprint(glaucoma_bp)
    app.register_blueprint(dr_bp)
    app.register_blueprint(biomarkers_bp)
    app.register_blueprint(api_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'status': 404
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'error': 'Method Not Allowed',
            'message': 'The method is not allowed for the requested URL',
            'status': 405
        }), 405
    
    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({
            'error': 'Payload Too Large',
            'message': 'The uploaded file is too large',
            'status': 413
        }), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'status': 500
        }), 500
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Medical AI Diagnostics API',
            'version': '1.0.0',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoints': {
                'health': '/api/health',
                'amd_oct': '/api/amd/oct',
                'amd_fundus': '/api/amd/fundus',
                'glaucoma': '/api/glaucoma/fundus',
                'dr_fundus': '/api/dr/fundus',
                'dr_oct': '/api/dr/oct',
                'biomarkers': '/api/biomarkers/<biomarker_name>',
                'biomarkers_list': '/api/biomarkers/list',
                'biomarkers_batch': '/api/biomarkers/batch',
                'dicom_metadata': '/api/dicom/metadata',
                'stats': '/api/stats',
                'models_info': '/api/models/info'
            },
            'documentation': 'https://github.com/your-repo/medical-ai-api'
        })
    
    # Health check endpoint for Docker
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        })
    
    return app

def main():
    """Main entry point for development server."""
    app = create_app('development')
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )

if __name__ == '__main__':
    main()
