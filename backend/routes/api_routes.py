from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
import os
import tempfile
import logging

from utils.dicom_utils import dicom_processor
from database.db import log_dicom_metadata, get_inference_stats
from utils.validators import validate_file

logger = logging.getLogger(__name__)

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
            'version': '1.0.0',
            'service': 'Medical AI API'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@api_bp.route('/dicom/metadata', methods=['POST'])
def extract_dicom_metadata():
    """Extract metadata from DICOM file."""
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        validation_result = validate_file(file)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['message']}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dcm') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Check if it's a DICOM file
            if not dicom_processor.is_dicom_file(temp_path):
                return jsonify({'error': 'File must be a DICOM file'}), 400
            
            # Read DICOM file
            dicom_data = dicom_processor.read_dicom_file(temp_path)
            
            # Extract metadata
            metadata = dicom_processor.extract_metadata(dicom_data)
            
            # Add file information
            metadata['file_name'] = secure_filename(file.filename)
            metadata['file_size'] = validation_result['size']
            
            # Anonymize sensitive data for response
            anonymized_metadata = dicom_processor.anonymize_metadata(metadata)
            
            # Log metadata extraction
            file_hash = dicom_processor.calculate_file_hash(temp_path)
            log_dicom_metadata(
                metadata,
                file_name=secure_filename(file.filename),
                file_size=validation_result['size'],  # Use correct file size
                file_hash=file_hash,
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'metadata': anonymized_metadata,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'status': 'success'
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error extracting DICOM metadata: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to extract DICOM metadata'
        }), 500

@api_bp.route('/stats', methods=['GET'])
def get_api_stats():
    """Get API usage statistics."""
    try:
        stats = get_inference_stats()
        
        return jsonify({
            'stats': stats,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting API stats: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to get API statistics'
        }), 500

@api_bp.route('/models/info', methods=['GET'])
def get_models_info():
    """Get information about loaded models."""
    try:
        from services.model_manager import get_model_manager
        
        model_manager = get_model_manager()
        models_info = model_manager.get_loaded_models_info()
        
        return jsonify({
            'models': models_info,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting models info: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to get models information'
        }), 500

@api_bp.route('/dr', methods=['POST'])
def predict_dr():
    """Diabetic Retinopathy prediction endpoint (placeholder)."""
    try:
        return jsonify({
            'message': 'Diabetic Retinopathy prediction coming soon',
            'status': 'not_implemented',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        }), 501
        
    except Exception as e:
        logger.error(f"Error in DR prediction: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'DR prediction not yet implemented'
        }), 500

@api_bp.route('/dicom/image', methods=['POST'])
def extract_dicom_image():
    """Extract image from DICOM file."""
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        validation_result = validate_file(file)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['message']}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dcm') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Check if it's a DICOM file
            if not dicom_processor.is_dicom_file(temp_path):
                return jsonify({'error': 'File must be a DICOM file'}), 400
            
            # Read DICOM file
            dicom_data = dicom_processor.read_dicom_file(temp_path)
            
            # Convert to PIL image
            pil_image = dicom_processor.dicom_to_pil_image(dicom_data)
            
            # Convert to base64
            import base64
            from io import BytesIO
            
            buffer = BytesIO()
            pil_image.save(buffer, format='PNG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return jsonify({
                'image': f'data:image/png;base64,{image_base64}',
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'status': 'success'
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error extracting DICOM image: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to extract DICOM image'
        }), 500
