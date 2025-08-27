from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class InferenceLog(db.Model):
    """Model for logging inference results."""
    __tablename__ = 'inference_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(50), nullable=False)  # 'amd_oct', 'amd_fundus', 'glaucoma', 'biomarker'
    model_name = db.Column(db.String(100), nullable=False)  # specific model name
    prediction = db.Column(db.Text, nullable=False)  # prediction result
    confidence = db.Column(db.Float, nullable=True)  # confidence score
    processing_time = db.Column(db.Float, nullable=False)  # processing time in seconds
    file_name = db.Column(db.String(255), nullable=True)  # original filename
    file_size = db.Column(db.Integer, nullable=True)  # file size in bytes
    ip_address = db.Column(db.String(45), nullable=True)  # client IP
    user_agent = db.Column(db.Text, nullable=True)  # client user agent
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<InferenceLog {self.id}: {self.model_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_type': self.model_type,
            'model_name': self.model_name,
            'prediction': self.prediction,
            'confidence': self.confidence,
            'processing_time': self.processing_time,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'timestamp': self.timestamp.isoformat()
        }

class DicomMetadata(db.Model):
    """Model for storing DICOM metadata."""
    __tablename__ = 'dicom_metadata'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(100), nullable=True)
    patient_name = db.Column(db.String(200), nullable=True)
    study_date = db.Column(db.String(20), nullable=True)
    study_time = db.Column(db.String(20), nullable=True)
    modality = db.Column(db.String(20), nullable=True)
    institution_name = db.Column(db.String(200), nullable=True)
    study_description = db.Column(db.Text, nullable=True)
    series_description = db.Column(db.Text, nullable=True)
    image_type = db.Column(db.String(100), nullable=True)
    rows = db.Column(db.Integer, nullable=True)
    columns = db.Column(db.Integer, nullable=True)
    pixel_spacing = db.Column(db.JSON, nullable=True)
    slice_thickness = db.Column(db.Float, nullable=True)
    file_name = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    file_hash = db.Column(db.String(64), nullable=True)  # SHA-256 hash
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<DicomMetadata {self.id}: {self.patient_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient_name,
            'study_date': self.study_date,
            'study_time': self.study_time,
            'modality': self.modality,
            'institution_name': self.institution_name,
            'study_description': self.study_description,
            'series_description': self.series_description,
            'image_type': self.image_type,
            'rows': self.rows,
            'columns': self.columns,
            'pixel_spacing': self.pixel_spacing,
            'slice_thickness': self.slice_thickness,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'timestamp': self.timestamp.isoformat()
        }

class BiomarkerPrediction(db.Model):
    """Model for biomarker prediction results."""
    __tablename__ = 'biomarker_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    biomarker_name = db.Column(db.String(100), nullable=False)
    predicted_value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=True)
    normal_range = db.Column(db.String(50), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    processing_time = db.Column(db.Float, nullable=False)
    file_name = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BiomarkerPrediction {self.id}: {self.biomarker_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'biomarker_name': self.biomarker_name,
            'predicted_value': self.predicted_value,
            'unit': self.unit,
            'normal_range': self.normal_range,
            'confidence': self.confidence,
            'processing_time': self.processing_time,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'timestamp': self.timestamp.isoformat()
        }
