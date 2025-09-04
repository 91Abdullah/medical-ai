from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
import os
import tempfile
from PIL import Image
import logging

from services.model_manager import get_model_manager
from utils.preprocessing import preprocessor
from utils.dicom_utils import dicom_processor
from database.db import log_inference, log_dicom_metadata
from utils.validators import validate_file

logger = logging.getLogger(__name__)

# Create blueprint
glaucoma_bp = Blueprint('glaucoma', __name__, url_prefix='/api/glaucoma')

@glaucoma_bp.route('/fundus', methods=['POST'])
def predict_glaucoma_fundus():
    """Glaucoma fundus classification endpoint."""
    start_time = time.time()
    
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
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Process image based on file type
            if dicom_processor.is_dicom_file(temp_path):
                # Handle DICOM file
                dicom_data = dicom_processor.read_dicom_file(temp_path)
                image = dicom_processor.dicom_to_pil_image(dicom_data)
                
                # Extract metadata
                metadata = dicom_processor.extract_metadata(dicom_data)
                log_dicom_metadata(
                    metadata, 
                    file_name=secure_filename(file.filename),
                    file_size=validation_result['size'],
                    ip_address=request.remote_addr
                )
            else:
                # Handle regular image file
                image = Image.open(temp_path)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
            
            # Preprocess image
            input_tensor = preprocessor.preprocess_keras(image)
            
            # Get model and make prediction
            model_manager = get_model_manager()
            glaucoma_model = model_manager.get_glaucoma_model()
            
            prediction_result = glaucoma_model.predict(input_tensor)
            
            processing_time = time.time() - start_time
            
            # Log inference
            log_inference(
                model_type='glaucoma',
                model_name='Glaucoma Fundus Classifier',
                prediction=prediction_result['prediction'],
                confidence=prediction_result['confidence'],
                processing_time=processing_time,
                file_name=secure_filename(file.filename),
                file_size=validation_result['size'],  # Use correct file size
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            # Prepare response
            response = {
                'prediction': prediction_result['prediction'],
                'confidence': prediction_result['confidence'],
                'classes': prediction_result['classes'],
                'class_probabilities': prediction_result['class_probabilities'],
                'processing_time': processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'model_type': 'Glaucoma Fundus Classifier'
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error in Glaucoma prediction: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process Glaucoma prediction'
        }), 500

@glaucoma_bp.route('/oct', methods=['POST'])
def predict_glaucoma_oct():
    """Glaucoma OCT classification endpoint."""
    start_time = time.time()
    
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
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Process image based on file type
            if dicom_processor.is_dicom_file(temp_path):
                # Handle DICOM file
                dicom_data = dicom_processor.read_dicom_file(temp_path)
                image = dicom_processor.dicom_to_pil_image(dicom_data)
                
                # Extract metadata
                metadata = dicom_processor.extract_metadata(dicom_data)
                log_dicom_metadata(
                    metadata, 
                    file_name=secure_filename(file.filename),
                    file_size=validation_result['size'],
                    ip_address=request.remote_addr
                )
            else:
                # Handle regular image file
                image = Image.open(temp_path)
                if image.mode not in ['L', 'RGB', 'RGBA']:
                    image = image.convert('L')  # Convert to grayscale for OCT
            
            # Preprocess image for OCT model
            input_tensor = preprocessor.preprocess_glaucoma_oct(image)
            
            # Get model and make prediction
            model_manager = get_model_manager()
            glaucoma_oct_model = model_manager.get_glaucoma_oct_model()
            
            prediction_result = glaucoma_oct_model.predict(input_tensor)
            
            processing_time = time.time() - start_time
            
            # Log inference
            log_inference(
                model_type='glaucoma_oct',
                model_name='Glaucoma OCT Classifier',
                prediction=prediction_result['prediction'],
                confidence=prediction_result['confidence'],
                processing_time=processing_time,
                file_name=secure_filename(file.filename),
                file_size=validation_result['size'],
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            # Prepare response
            response = {
                'prediction': prediction_result['prediction'],
                'confidence': prediction_result['confidence'],
                'probability': prediction_result.get('probability', 0.0),
                'classes': prediction_result['classes'],
                'class_probabilities': prediction_result['class_probabilities'],
                'processing_time': processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'model_type': 'Glaucoma OCT Classifier'
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error in Glaucoma OCT prediction: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process Glaucoma OCT prediction'
        }), 500
