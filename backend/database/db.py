from .models import db, InferenceLog, DicomMetadata, BiomarkerPrediction
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def init_db(app):
    """Initialize database with app context."""
    db.init_app(app)
    
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error creating database tables: {e}")
            raise

def get_db_session():
    """Get database session."""
    return db.session

def log_inference(model_type, model_name, prediction, confidence=None, 
                 processing_time=None, file_name=None, file_size=None, 
                 ip_address=None, user_agent=None):
    """Log inference result to database."""
    try:
        log_entry = InferenceLog(
            model_type=model_type,
            model_name=model_name,
            prediction=str(prediction),
            confidence=confidence,
            processing_time=processing_time,
            file_name=file_name,
            file_size=file_size,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log_entry)
        db.session.commit()
        logger.info(f"Logged inference: {model_type} - {model_name}")
        return log_entry
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error logging inference: {e}")
        raise

def log_dicom_metadata(metadata_dict, file_name=None, file_size=None, 
                      file_hash=None, ip_address=None):
    """Log DICOM metadata to database."""
    try:
        metadata_entry = DicomMetadata(
            patient_id=metadata_dict.get('patient_id'),
            patient_name=metadata_dict.get('patient_name'),
            study_date=metadata_dict.get('study_date'),
            study_time=metadata_dict.get('study_time'),
            modality=metadata_dict.get('modality'),
            institution_name=metadata_dict.get('institution_name'),
            study_description=metadata_dict.get('study_description'),
            series_description=metadata_dict.get('series_description'),
            image_type=metadata_dict.get('image_type'),
            rows=metadata_dict.get('rows'),
            columns=metadata_dict.get('columns'),
            pixel_spacing=metadata_dict.get('pixel_spacing'),
            slice_thickness=metadata_dict.get('slice_thickness'),
            file_name=file_name,
            file_size=file_size,
            file_hash=file_hash,
            ip_address=ip_address
        )
        db.session.add(metadata_entry)
        db.session.commit()
        logger.info(f"Logged DICOM metadata for: {file_name}")
        return metadata_entry
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error logging DICOM metadata: {e}")
        raise

def log_biomarker_prediction(biomarker_name, predicted_value, unit=None, 
                           normal_range=None, confidence=None, processing_time=None,
                           file_name=None, file_size=None, ip_address=None):
    """Log biomarker prediction to database."""
    try:
        prediction_entry = BiomarkerPrediction(
            biomarker_name=biomarker_name,
            predicted_value=predicted_value,
            unit=unit,
            normal_range=normal_range,
            confidence=confidence,
            processing_time=processing_time,
            file_name=file_name,
            file_size=file_size,
            ip_address=ip_address
        )
        db.session.add(prediction_entry)
        db.session.commit()
        logger.info(f"Logged biomarker prediction: {biomarker_name}")
        return prediction_entry
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error logging biomarker prediction: {e}")
        raise

def get_inference_stats():
    """Get inference statistics."""
    try:
        total_inferences = InferenceLog.query.count()
        recent_inferences = InferenceLog.query.order_by(InferenceLog.timestamp.desc()).limit(10).all()
        
        # Count by model type
        model_counts = db.session.query(
            InferenceLog.model_type,
            db.func.count(InferenceLog.id).label('count')
        ).group_by(InferenceLog.model_type).all()
        
        return {
            'total_inferences': total_inferences,
            'recent_inferences': [log.to_dict() for log in recent_inferences],
            'model_counts': {model_type: count for model_type, count in model_counts}
        }
    except SQLAlchemyError as e:
        logger.error(f"Error getting inference stats: {e}")
        return {}
