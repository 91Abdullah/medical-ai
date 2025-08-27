from werkzeug.datastructures import FileStorage
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'dcm', 'dicom'}
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/dicom',
    "application/dicom+json",
    "application/x-dicom",
    'application/octet-stream'  # Some DICOM files might use this
}

# File size limits (in bytes)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MIN_FILE_SIZE = 1024  # 1KB

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file(file: FileStorage) -> Dict[str, any]:
    """Validate uploaded file."""
    try:
        # Check if file exists
        if not file or not file.filename:
            return {'valid': False, 'message': 'No file provided'}
        
        # Check file extension
        if not allowed_file(file.filename):
            return {
                'valid': False, 
                'message': f'File type not allowed. Supported types: {", ".join(ALLOWED_EXTENSIONS)}'
            }
        
        # Check MIME type
        if file.content_type not in ALLOWED_MIME_TYPES:
            return {
                'valid': False,
                'message': f'Invalid file type. Content-Type: {file.content_type}'
            }
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            return {
                'valid': False,
                'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
            }
        
        if file_size < MIN_FILE_SIZE:
            return {
                'valid': False,
                'message': f'File too small. Minimum size: {MIN_FILE_SIZE} bytes'
            }
        
        return {'valid': True, 'message': 'File validation passed', 'size': file_size}
        
    except Exception as e:
        logger.error(f"Error validating file: {e}")
        return {'valid': False, 'message': 'File validation failed'}

def validate_image_file(file: FileStorage) -> Dict[str, any]:
    """Validate that the file is a valid image."""
    try:
        from PIL import Image
        import io
        
        # First do basic file validation
        validation_result = validate_file(file)
        if not validation_result['valid']:
            return validation_result
        
        # Try to open as image (skip for DICOM files)
        if file.content_type != 'application/dicom':
            try:
                # Read file content
                file_content = file.read()
                file.seek(0)  # Reset file pointer
                
                # Try to open with PIL
                image = Image.open(io.BytesIO(file_content))
                image.verify()  # Verify it's a valid image
                
                # Check image dimensions
                file.seek(0)
                image = Image.open(io.BytesIO(file.read()))
                width, height = image.size
                file.seek(0)  # Reset again
                
                if width < 50 or height < 50:
                    return {
                        'valid': False,
                        'message': 'Image too small. Minimum dimensions: 50x50 pixels'
                    }
                
                if width > 4096 or height > 4096:
                    return {
                        'valid': False,
                        'message': 'Image too large. Maximum dimensions: 4096x4096 pixels'
                    }
                
                return {
                    'valid': True, 
                    'message': 'Image validation passed',
                    'dimensions': (width, height),
                    'size': validation_result['size']
                }
                
            except Exception as img_error:
                logger.error(f"Image validation error: {img_error}")
                return {
                    'valid': False,
                    'message': 'Invalid image file or corrupted image'
                }
        else:
            # For DICOM files, just return the basic validation
            return validation_result
            
    except Exception as e:
        logger.error(f"Error in image validation: {e}")
        return {'valid': False, 'message': 'Image validation failed'}

def validate_biomarker_name(biomarker_name: str) -> Dict[str, any]:
    """Validate biomarker name."""
    from services.model_service import BiomarkerModel
    
    valid_biomarkers = list(BiomarkerModel.BIOMARKER_CONFIG.keys())
    
    if biomarker_name not in valid_biomarkers:
        return {
            'valid': False,
            'message': f'Invalid biomarker name. Valid options: {", ".join(valid_biomarkers)}'
        }
    
    return {'valid': True, 'message': 'Biomarker name validation passed'}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    import re
    import unicodedata
    
    # Remove or replace unsafe characters
    filename = unicodedata.normalize('NFKD', filename)
    filename = filename.encode('ascii', 'ignore').decode('ascii')
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Limit length
    name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}.{ext}" if ext else name

def validate_api_request(required_fields: List[str], request_data: Dict) -> Dict[str, any]:
    """Validate API request contains required fields."""
    missing_fields = []
    
    for field in required_fields:
        if field not in request_data or request_data[field] is None:
            missing_fields.append(field)
    
    if missing_fields:
        return {
            'valid': False,
            'message': f'Missing required fields: {", ".join(missing_fields)}'
        }
    
    return {'valid': True, 'message': 'Request validation passed'}
