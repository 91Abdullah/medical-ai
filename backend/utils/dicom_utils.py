import pydicom
import numpy as np
from PIL import Image
import hashlib
import logging
from typing import Dict, Any, Optional, Tuple
import io
from pydicom.multival import MultiValue
from pydicom.valuerep import PersonName

logger = logging.getLogger(__name__)

class DicomProcessor:
    """DICOM file processing utilities."""
    
    def __init__(self):
        self.supported_modalities = ['OCT', 'OP', 'OPT', 'CF', 'CR', 'DX', 'MG', 'US', 'CT', 'MR']

    def is_dicom_file(self, fp: str | bytes) -> bool:
        """
        True if file is DICOM:
        - Either has 'DICM' at byte offset 128
        - Or pydicom can read it without raising
        """
        try:
            if isinstance(fp, (bytes, bytearray)):
                bio = io.BytesIO(fp)
                bio.seek(128)
                return bio.read(4) == b"DICM"
            else:
                with open(fp, "rb") as f:
                    f.seek(128)
                    return f.read(4) == b"DICM"
        except Exception:
            # fall back to trying to read via pydicom
            try:
                pydicom.dcmread(fp, stop_before_pixels=True)
                return True
            except Exception:
                return False
    
    def read_dicom_file(self, file_path: str) -> pydicom.FileDataset:
        """Read DICOM file and return dataset."""
        try:
            dicom_data = pydicom.dcmread(file_path, force=True)
            return dicom_data
        except Exception as e:
            logger.error(f"Error reading DICOM file {file_path}: {e}")
            raise
    
    def read_dicom_from_bytes(self, file_bytes: bytes) -> pydicom.FileDataset:
        """Read DICOM from bytes and return dataset."""
        try:
            from io import BytesIO
            dicom_data = pydicom.dcmread(BytesIO(file_bytes), force=True)
            return dicom_data
        except Exception as e:
            logger.error(f"Error reading DICOM from bytes: {e}")
            raise
    
    def extract_metadata(self, dicom_data: pydicom.FileDataset) -> Dict[str, Any]:
        """Extract relevant metadata from DICOM dataset."""
        try:
            metadata = {}
            
            # Patient information
            metadata['patient_id'] = self._safe_get_tag(dicom_data, 'PatientID', '')
            metadata['patient_name'] = self._safe_get_tag(dicom_data, 'PatientName', '')
            
            # Study information
            metadata['study_date'] = self._safe_get_tag(dicom_data, 'StudyDate', '')
            metadata['study_time'] = self._safe_get_tag(dicom_data, 'StudyTime', '')
            metadata['study_description'] = self._safe_get_tag(dicom_data, 'StudyDescription', '')
            metadata['study_instance_uid'] = self._safe_get_tag(dicom_data, 'StudyInstanceUID', '')
            
            # Series information
            metadata['series_description'] = self._safe_get_tag(dicom_data, 'SeriesDescription', '')
            metadata['series_number'] = self._safe_get_tag(dicom_data, 'SeriesNumber', '')
            metadata['modality'] = self._safe_get_tag(dicom_data, 'Modality', '')
            
            # Institution information
            metadata['institution_name'] = self._safe_get_tag(dicom_data, 'InstitutionName', '')
            metadata['manufacturer'] = self._safe_get_tag(dicom_data, 'Manufacturer', '')
            metadata['manufacturer_model_name'] = self._safe_get_tag(dicom_data, 'ManufacturerModelName', '')
            
            # Image information
            metadata['image_type'] = self._safe_get_tag(dicom_data, 'ImageType', '')
            if isinstance(metadata['image_type'], list):
                metadata['image_type'] = "|".join(map(str, metadata['image_type']))

            metadata['rows'] = self._safe_get_tag(dicom_data, 'Rows', 0)
            metadata['columns'] = self._safe_get_tag(dicom_data, 'Columns', 0)
            
            # Pixel information
            pixel_spacing = self._safe_get_tag(dicom_data, 'PixelSpacing', None)
            if pixel_spacing:
                metadata['pixel_spacing'] = [float(x) for x in pixel_spacing]
            else:
                metadata['pixel_spacing'] = []
            
            metadata['slice_thickness'] = self._safe_get_tag(dicom_data, 'SliceThickness', None)
            metadata['bits_allocated'] = self._safe_get_tag(dicom_data, 'BitsAllocated', 0)
            metadata['bits_stored'] = self._safe_get_tag(dicom_data, 'BitsStored', 0)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting DICOM metadata: {e}")
            raise
    
    def extract_pixel_data(self, dicom_data: pydicom.FileDataset) -> np.ndarray:
        """Extract pixel data from DICOM dataset."""
        try:
            if not hasattr(dicom_data, 'pixel_array'):
                raise ValueError("DICOM file does not contain pixel data")
            
            pixel_array = dicom_data.pixel_array
            
            # Handle different bit depths
            if dicom_data.get('BitsAllocated', 8) > 8:
                # Normalize to 8-bit for processing
                pixel_array = self._normalize_to_8bit(pixel_array)
            
            # Handle different photometric interpretations
            photometric = dicom_data.get('PhotometricInterpretation', '')
            if photometric == 'MONOCHROME1':
                # Invert grayscale
                pixel_array = np.max(pixel_array) - pixel_array
            
            return pixel_array
            
        except Exception as e:
            logger.error(f"Error extracting pixel data: {e}")
            raise
    
    def dicom_to_pil_image(self, dicom_data: pydicom.FileDataset) -> Image.Image:
        """Convert DICOM pixel data to PIL Image."""
        try:
            pixel_array = self.extract_pixel_data(dicom_data)
            
            # Convert to uint8 if needed
            if pixel_array.dtype != np.uint8:
                pixel_array = pixel_array.astype(np.uint8)
            
            # Handle different image dimensions
            if len(pixel_array.shape) == 2:
                # Grayscale image
                image = Image.fromarray(pixel_array, mode='L')
                # Convert to RGB for consistent processing
                image = image.convert('RGB')
            elif len(pixel_array.shape) == 3:
                # Multi-channel image
                if pixel_array.shape[2] == 3:
                    image = Image.fromarray(pixel_array, mode='RGB')
                elif pixel_array.shape[2] == 4:
                    image = Image.fromarray(pixel_array, mode='RGBA')
                    image = image.convert('RGB')
                else:
                    # Take first channel and convert to RGB
                    image = Image.fromarray(pixel_array[:, :, 0], mode='L')
                    image = image.convert('RGB')
            else:
                raise ValueError(f"Unsupported pixel array shape: {pixel_array.shape}")
            
            return image
            
        except Exception as e:
            logger.error(f"Error converting DICOM to PIL image: {e}")
            raise
    
    def validate_dicom_file(self, file_path: str) -> Tuple[bool, str]:
        """Validate if file is a valid DICOM file."""
        try:
            dicom_data = self.read_dicom_file(file_path)
            
            # Check if it has required DICOM elements
            if not hasattr(dicom_data, 'SOPClassUID'):
                return False, "Missing required DICOM elements"
            
            # Check modality
            modality = self._safe_get_tag(dicom_data, 'Modality', '')
            if modality and modality not in self.supported_modalities:
                return False, f"Unsupported modality: {modality}"
            
            # Check if it has pixel data
            if not hasattr(dicom_data, 'pixel_array'):
                return False, "No pixel data found"
            
            return True, "Valid DICOM file"
            
        except Exception as e:
            return False, f"Invalid DICOM file: {str(e)}"
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file."""
        try:
            hash_sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logger.error(f"Error calculating file hash: {e}")
            return ""
    
    def anonymize_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Remove or anonymize sensitive patient information."""
        anonymized = metadata.copy()
        
        # Fields to anonymize
        sensitive_fields = [
            'patient_name',
            'patient_id'
        ]
        
        for field in sensitive_fields:
            if field in anonymized:
                if field == 'patient_name':
                    anonymized[field] = 'ANONYMOUS'
                elif field == 'patient_id':
                    anonymized[field] = 'ANON_' + hashlib.md5(str(metadata.get(field, '')).encode()).hexdigest()[:8]
        
        return anonymized
    
    # replace the body of _safe_get_tag with this logic
    def _safe_get_tag(self, dicom_data, tag_name: str, default=None):
        try:
            if hasattr(dicom_data, tag_name):
                value = getattr(dicom_data, tag_name)

                # MultiValue (e.g., ImageType, PixelSpacing) -> list
                if isinstance(value, MultiValue):
                    return list(value)

                # PersonName -> plain string (avoid list of chars)
                if isinstance(value, PersonName):
                    return str(value)

                # numbers stay as-is; everything else to str
                if isinstance(value, (int, float)):
                    return value
                return str(value) if value is not None else default
            return default
        except Exception:
            return default

    
    def _normalize_to_8bit(self, pixel_array: np.ndarray) -> np.ndarray:
        """Normalize pixel array to 8-bit range."""
        try:
            # Get min and max values
            min_val = np.min(pixel_array)
            max_val = np.max(pixel_array)
            
            if max_val == min_val:
                return np.zeros_like(pixel_array, dtype=np.uint8)
            
            # Normalize to 0-255 range
            normalized = ((pixel_array - min_val) / (max_val - min_val) * 255).astype(np.uint8)
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing to 8-bit: {e}")
            return pixel_array.astype(np.uint8)

# Global DICOM processor instance
dicom_processor = DicomProcessor()
