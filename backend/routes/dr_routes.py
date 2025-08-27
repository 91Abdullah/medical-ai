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
from database.db import log_inference
from utils.validators import validate_file

logger = logging.getLogger(__name__)

# Create blueprint
dr_bp = Blueprint('dr', __name__, url_prefix='/api/dr')

@dr_bp.route('/fundus', methods=['POST'])
def predict_dr_fundus():
    """DR fundus prediction endpoint."""
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
            # Process image
            if file.content_type == 'application/dicom':
                dicom_data = dicom_processor.read_dicom_file(temp_path)
                image = dicom_processor.dicom_to_pil_image(dicom_data)
            else:
                image = Image.open(temp_path)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
            
            # Preprocess image for DR model
            input_tensor = preprocessor.preprocess_fundus(image)
            
            # Get model and make prediction
            model_manager = get_model_manager()
            dr_model = model_manager.get_dr_model()
            prediction_result = dr_model.predict(input_tensor)
            
            processing_time = time.time() - start_time
            
            # Log the inference
            log_inference(
                model_type='dr_fundus',
                model_name='DR Fundus Classifier',   
                prediction=prediction_result['prediction'],
                confidence=prediction_result['confidence'],
                processing_time=processing_time,
                file_name=secure_filename(file.filename),
                file_size=len(file.read()),
                ip_address=request.remote_addr
            )
            
            # Prepare response
            response = {
                'prediction': prediction_result['prediction'],
                'confidence': prediction_result['confidence'],
                'probabilities': prediction_result['probabilities'],
                'processing_time': processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'model_info': {
                    'type': 'DR Fundus Classifier',
                    'classes': prediction_result['classes'],
                    'model_version': '1.0'
                }
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error in DR fundus prediction: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process DR fundus prediction'
        }), 500

@dr_bp.route('/oct', methods=['POST'])
def predict_dr_oct():
    """DR OCT prediction endpoint."""
    start_time = time.time()

    try:
        # Get the uploaded file
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file uploaded'}), 400

        # Validate file
        validation_result = validate_file(file)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['message']}), 400

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        try:
            # Process image
            if file.content_type == 'application/dicom':
                dicom_data = dicom_processor.read_dicom_file(temp_path)
                image = dicom_processor.dicom_to_pil_image(dicom_data)
            else:
                image = Image.open(temp_path)

            # Preprocess image for DR OCT model
            input_tensor = preprocessor.preprocess_oct_keras(image)

            # Get model and make prediction
            model_manager = get_model_manager()
            dr_oct_model = model_manager.get_dr_oct_model()
            prediction_result = dr_oct_model.predict(input_tensor)

            processing_time = time.time() - start_time

            # Log the inference
            log_inference(
                model_type='dr_oct',
                model_name='DR OCT Classifier',
                prediction=prediction_result['prediction'],
                confidence=prediction_result['confidence'],
                processing_time=processing_time,
                file_name=secure_filename(file.filename),
                file_size=len(file.read()),
                ip_address=request.remote_addr
            )

            # Prepare response
            response = {
                'prediction': prediction_result['prediction'],
                'confidence': prediction_result['confidence'],
                'probabilities': prediction_result['probabilities'],
                'processing_time': processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'model_info': {
                    'type': 'DR OCT Classifier',
                    'classes': prediction_result['classes'],
                    'model_version': '1.0'
                }
            }

            return jsonify(response), 200

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Error in DR OCT prediction: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process DR OCT prediction'
        }), 500

@dr_bp.route('/info', methods=['GET'])
def dr_info():
    """Get DR model information."""
    try:
        model_manager = get_model_manager()
        info = {
            'fundus_model': {
                'available': True,
                'classes': ['No DR', 'Early pathology', 'Advanced pathology'],
                'description': 'PyTorch ResNet-based model for DR classification',
                'input_size': [224, 224],
                'model_type': 'multiclass'
            },
            'oct_model': {
                'available': False,
                'description': 'Coming soon',
                'status': 'Under development'
            }
        }
        return jsonify(info), 200
    except Exception as e:
        logger.error(f"Error getting DR info: {e}")
        return jsonify({'error': 'Failed to get DR model information'}), 500
