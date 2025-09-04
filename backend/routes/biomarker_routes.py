from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
import os
import tempfile
from PIL import Image
import logging
from urllib.parse import unquote

from services.model_manager import get_model_manager
from utils.preprocessing import preprocessor
from utils.dicom_utils import dicom_processor
from database.db import log_biomarker_prediction, log_dicom_metadata
from utils.validators import validate_file, validate_biomarker_name
from services.model_service import BiomarkerModel

logger = logging.getLogger(__name__)

# Create blueprint
biomarkers_bp = Blueprint('biomarkers', __name__, url_prefix='/api/biomarkers')

@biomarkers_bp.route('/<biomarker_name>', methods=['POST'])
def predict_biomarker(biomarker_name: str):
    """Biomarker prediction endpoint."""
    start_time = time.time()
    
    try:
        # URL decode biomarker name
        biomarker_name = unquote(biomarker_name)
        
        # Validate biomarker name
        biomarker_validation = validate_biomarker_name(biomarker_name)
        if not biomarker_validation['valid']:
            return jsonify({'error': biomarker_validation['message']}), 400
        
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
                    file_size=validation_result['size'],  # Use correct file size
                    ip_address=request.remote_addr
                )
            else:
                # Handle regular image file
                image = Image.open(temp_path)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
            
            # Preprocess image
            input_tensor = preprocessor.preprocess_biomarker(image)
            
            # Get model and make prediction
            model_manager = get_model_manager()
            biomarker_model = model_manager.get_biomarker_model(biomarker_name)
            
            prediction_result = biomarker_model.predict(input_tensor)
            
            processing_time = time.time() - start_time
            
            # Log biomarker prediction
            log_biomarker_prediction(
                biomarker_name=biomarker_name,
                predicted_value=prediction_result['predicted_value'],
                unit=prediction_result['unit'],
                normal_range=prediction_result['normal_range'],
                confidence=prediction_result['confidence'],
                processing_time=processing_time,
                file_name=secure_filename(file.filename),
                file_size=validation_result['size'],  # Use correct file size
                ip_address=request.remote_addr
            )
            
            # Prepare response
            response = {
                'biomarker_name': prediction_result['biomarker_name'],
                'predicted_value': round(prediction_result['predicted_value'], 2),
                'unit': prediction_result['unit'],
                'normal_range': prediction_result['normal_range'],
                'confidence': prediction_result['confidence'],
                'processing_time': processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'model_type': f'Biomarker Model - {biomarker_name}'
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error in biomarker prediction for {biomarker_name}: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': f'Failed to process biomarker prediction for {biomarker_name}'
        }), 500

@biomarkers_bp.route('/list', methods=['GET'])
def list_biomarkers():
    """List all available biomarkers."""
    try:
        biomarkers = list(BiomarkerModel.BIOMARKER_CONFIG.keys())
        biomarker_info = []
        
        for biomarker in biomarkers:
            config = BiomarkerModel.BIOMARKER_CONFIG[biomarker]
            biomarker_info.append({
                'name': biomarker,
                'unit': config.get('unit', ''),
                'normal_range': config.get('normal_range', 'N/A'),
                'endpoint': f'/api/biomarkers/{biomarker.replace(" ", "%20")}'
            })
        
        return jsonify({
            'biomarkers': biomarker_info,
            'total_count': len(biomarkers)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing biomarkers: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to list biomarkers'
        }), 500

@biomarkers_bp.route('/batch', methods=['POST'])
def predict_multiple_biomarkers():
    """Predict multiple biomarkers from a single image."""
    start_time = time.time()
    
    try:
        # Get biomarker names from request
        biomarker_names = request.form.getlist('biomarkers')
        if not biomarker_names:
            # Default to all biomarkers if none specified
            biomarker_names = list(BiomarkerModel.BIOMARKER_CONFIG.keys())
        
        # Validate biomarker names
        for biomarker_name in biomarker_names:
            validation = validate_biomarker_name(biomarker_name)
            if not validation['valid']:
                return jsonify({'error': f'Invalid biomarker: {biomarker_name}'}), 400
        
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
            if dicom_processor.is_dicom_file(temp_path):
                dicom_data = dicom_processor.read_dicom_file(temp_path)
                image = dicom_processor.dicom_to_pil_image(dicom_data)
            else:
                image = Image.open(temp_path)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
            
            # Preprocess image once
            input_tensor = preprocessor.preprocess_biomarker(image)
            
            # Get model manager
            model_manager = get_model_manager()
            
            # Make predictions for all requested biomarkers
            predictions = []
            for biomarker_name in biomarker_names:
                try:
                    biomarker_model = model_manager.get_biomarker_model(biomarker_name)
                    prediction_result = biomarker_model.predict(input_tensor)
                    predictions.append(prediction_result)
                    
                    # Log individual prediction
                    log_biomarker_prediction(
                        biomarker_name=biomarker_name,
                        predicted_value=prediction_result['predicted_value'],
                        unit=prediction_result['unit'],
                        normal_range=prediction_result['normal_range'],
                        confidence=prediction_result['confidence'],
                        processing_time=time.time() - start_time,
                        file_name=secure_filename(file.filename),
                        file_size=validation_result['size'],  # Use correct file size
                        ip_address=request.remote_addr
                    )
                    
                except Exception as e:
                    logger.error(f"Error predicting biomarker {biomarker_name}: {e}")
                    # Continue with other biomarkers
                    continue
            
            total_processing_time = time.time() - start_time
            
            # Prepare response
            response = {
                'predictions': predictions,
                'total_processing_time': total_processing_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                'processed_biomarkers': len(predictions),
                'requested_biomarkers': len(biomarker_names)
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        logger.error(f"Error in batch biomarker prediction: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process batch biomarker prediction'
        }), 500
