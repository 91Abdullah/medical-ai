import io
import os
import cv2
import numpy as np
from PIL import Image, ImageOps
import torch
import torchvision.transforms as transforms
from typing import Tuple, Union
import logging
from keras.utils import img_to_array, load_img as k_load

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Image preprocessing utilities for medical images."""
    
    def __init__(self):
        # Standard medical image preprocessing transforms
        self.oct_transforms = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485], std=[0.229])  # Single channel normalization
        ])

        self.fundus_amd_transforms = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])
        
        self.fundus_transforms = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        self.biomarker_transforms = transforms.Compose([
            transforms.Resize((540, 540)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def load_image(self, image_path: str) -> Image.Image:
        """Load image from file path."""
        try:
            image = Image.open(image_path)
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            return image
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {e}")
            raise
    
    def load_image_from_bytes(self, image_bytes: bytes) -> Image.Image:
        """Load image from bytes."""
        try:
            from io import BytesIO
            image = Image.open(BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            return image
        except Exception as e:
            logger.error(f"Error loading image from bytes: {e}")
            raise
    
    def preprocess_oct(self, image: Union[str, Image.Image, np.ndarray]) -> torch.Tensor:
        """Preprocess OCT image for AMD classification."""
        try:
            if isinstance(image, str):
                image = self.load_image(image)
            elif isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Apply OCT-specific preprocessing
            processed = self.oct_transforms(image)
            
            # Add batch dimension
            return processed.unsqueeze(0)
            
        except Exception as e:
            logger.error(f"Error preprocessing OCT image: {e}")
            raise

    def preprocess_fundus_amd(self, image: Union[str, Image.Image, np.ndarray]) -> torch.Tensor:
        """Preporcess fundus image for AMD"""
        try:
            if isinstance(image, str):
                image = self.load_image(image)
            elif isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            processed = self.fundus_amd_transforms(image)
            
            # Add batch dimension
            return processed.unsqueeze(0)
            
        except Exception as e:
            logger.error(f"Error preprocessing fundus image: {e}")
            raise

    def preprocess_oct_keras(self, image: Union[str, Image.Image, np.ndarray], size=(224, 224)) -> np.ndarray:
        """Preprocess OCT image for Keras models."""
        try:
            if isinstance(image, (str, os.PathLike, io.BytesIO)):
                im = k_load(image, target_size=size, color_mode="rgb")
            elif isinstance(image, Image.Image):
                im = image.convert("RGB").resize(size, Image.BILINEAR)
            elif isinstance(image, np.ndarray):
                im = Image.fromarray(image).convert("RGB").resize(size, Image.BILINEAR)
            else:
                raise TypeError(f"Unsupported type: {type(image)}")

            arr = img_to_array(im, dtype="float32") / 255.0  # (H, W, 3) float32
            return np.expand_dims(arr, axis=0)               # (1, H, W, 3)
        except Exception as e:
            logger.error(f"Error preprocessing OCT Keras image: {e}")
            raise        

    def preprocess_oct(self, image: Union[str, Image.Image, np.ndarray], size=(256, 256)) -> torch.Tensor:
        """Preprocess OCT image for PyTorch models (grayscale)."""
        try:
            if isinstance(image, str):
                image = self.load_image(image)
            elif isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Convert to grayscale for OCT images
            if image.mode != 'L':
                image = image.convert('L')
            
            # Apply OCT-specific preprocessing
            processed = self.oct_transforms(image)
            
            # Add batch dimension
            return processed.unsqueeze(0)
            
        except Exception as e:
            logger.error(f"Error preprocessing OCT image: {e}")
            raise

        except Exception as e:
            logger.error(f"Error preprocessing OCT image: {e}")
            raise

    # Batch Inference Utility for Glaucoma OCT Model
    def batch_predict_glaucoma_oct(image_paths, model_path="models/glaucoma_oct.pt", threshold=0.92):
        """
        Perform batch inference on multiple OCT images for glaucoma detection.
        
        Args:
            image_paths: List of paths to OCT images
            model_path: Path to the glaucoma OCT model
            threshold: Classification threshold (default: 0.92)
        
        Returns:
            List of dictionaries with prediction results
        """
        import torch
        import torch.nn as nn
        from torchvision.models import densenet121
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load and setup model using torchvision DenseNet
        model = densenet121(pretrained=False)
        # Modify for single channel input and binary classification
        model.features[0] = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        model.classifier = nn.Linear(model.classifier.in_features, 1)
        
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
        model.to(device)
        
        # Setup preprocessing
        preprocess = transforms.Compose([
            transforms.Resize((224, 224)),  # DenseNet standard size
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485], std=[0.229])
        ])
        
        results = []
        with torch.no_grad():
            for p in image_paths:
                try:
                    # Load and preprocess image
                    image = Image.open(p).convert('L')  # Convert to grayscale
                    input_tensor = preprocess(image).unsqueeze(0).to(device)
                    
                    # Make prediction
                    prob = torch.sigmoid(model(input_tensor)).item()
                    pred = int(prob >= threshold)
                    
                    results.append({
                        "image": os.path.basename(p), 
                        "probability": prob, 
                        "prediction": pred,
                        "class": "Glaucoma" if pred == 1 else "Healthy"
                    })
                except Exception as e:
                    logger.error(f"Error processing {p}: {e}")
                    results.append({
                        "image": os.path.basename(p), 
                        "probability": 0.0, 
                        "prediction": 0,
                        "class": "Error"
                    })
        
        return results

    def preprocess_keras(self, image: Union[str, Image.Image, np.ndarray], size=(256, 256)) -> np.ndarray:
        try:
            if isinstance(image, (str, os.PathLike, io.BytesIO)):
                im = k_load(image, target_size=size, color_mode="rgb")
            elif isinstance(image, Image.Image):
                im = image.convert("RGB").resize(size, Image.BILINEAR)
            elif isinstance(image, np.ndarray):
                im = Image.fromarray(image).convert("RGB").resize(size, Image.BILINEAR)
            else:
                raise TypeError(f"Unsupported type: {type(image)}")

            arr = img_to_array(im, dtype="float32") / 255.0  # (H, W, 3) float32
            return np.expand_dims(arr, axis=0)               # (1, H, W, 3)
        except Exception as e:
            logger.error(f"Error preprocessing Keras image: {e}")
            raise
        
    def preprocess_fundus(self, image: Union[str, Image.Image, np.ndarray]) -> torch.Tensor:
        """Preprocess fundus image for analysis."""
        try:
            if isinstance(image, str):
                image = self.load_image(image)
            elif isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Apply fundus-specific preprocessing
            processed = self.fundus_transforms(image)
            
            # Add batch dimension
            return processed.unsqueeze(0)
            
        except Exception as e:
            logger.error(f"Error preprocessing fundus image: {e}")
            raise
    
    def preprocess_biomarker(self, image: Union[str, Image.Image, np.ndarray]) -> torch.Tensor:
        """Preprocess image for biomarker prediction."""
        try:
            if isinstance(image, str):
                image = self.load_image(image)
            elif isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Apply biomarker-specific preprocessing
            # image = self._crop_fundus_roi(image)
            # image = self._normalize_fundus_illumination(image)
            processed = self.biomarker_transforms(image)
            
            # Add batch dimension
            return processed.unsqueeze(0)
            
        except Exception as e:
            logger.error(f"Error preprocessing biomarker image: {e}")
            raise
    
    def _enhance_oct_contrast(self, image: Image.Image) -> Image.Image:
        """Enhance contrast for OCT images."""
        try:
            # Convert to numpy for processing
            img_array = np.array(image)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            if len(img_array.shape) == 3:
                # For color images, apply to each channel
                img_yuv = cv2.cvtColor(img_array, cv2.COLOR_RGB2YUV)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                img_yuv[:,:,0] = clahe.apply(img_yuv[:,:,0])
                img_array = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2RGB)
            else:
                # For grayscale images
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                img_array = clahe.apply(img_array)
            
            return Image.fromarray(img_array)
            
        except Exception as e:
            logger.warning(f"Could not enhance OCT contrast: {e}")
            return image
    
    def _crop_fundus_roi(self, image: Image.Image) -> Image.Image:
        """Crop fundus image to region of interest (optic disc area)."""
        try:
            # Convert to numpy for processing
            img_array = np.array(image)
            
            # Find the circular boundary of the fundus
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply threshold to find the fundus boundary
            _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Find the largest contour (should be the fundus boundary)
                largest_contour = max(contours, key=cv2.contourArea)
                
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # Crop with some padding
                padding = 20
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(img_array.shape[1], x + w + padding)
                y2 = min(img_array.shape[0], y + h + padding)
                
                cropped = img_array[y1:y2, x1:x2]
                return Image.fromarray(cropped)
            
            return image
            
        except Exception as e:
            logger.warning(f"Could not crop fundus ROI: {e}")
            return image
    
    def _normalize_fundus_illumination(self, image: Image.Image) -> Image.Image:
        """Normalize illumination in fundus images."""
        try:
            img_array = np.array(image)
            
            # Convert to LAB color space
            lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
            
            # Apply CLAHE to the L channel
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            lab[:,:,0] = clahe.apply(lab[:,:,0])
            
            # Convert back to RGB
            normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            return Image.fromarray(normalized)
            
        except Exception as e:
            logger.warning(f"Could not normalize fundus illumination: {e}")
            return image
    
    def resize_image(self, image: Image.Image, size: Tuple[int, int]) -> Image.Image:
        """Resize image while maintaining aspect ratio."""
        return ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    
    def augment_image(self, image: Image.Image, augmentation_type: str = 'basic') -> Image.Image:
        """Apply data augmentation for training (if needed)."""
        augmentation_transforms = {
            'basic': transforms.Compose([
                transforms.RandomRotation(10),
                transforms.RandomHorizontalFlip(0.5),
                transforms.ColorJitter(brightness=0.2, contrast=0.2)
            ]),
            'advanced': transforms.Compose([
                transforms.RandomRotation(15),
                transforms.RandomHorizontalFlip(0.5),
                transforms.RandomVerticalFlip(0.3),
                transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
                transforms.RandomAffine(degrees=0, translate=(0.1, 0.1))
            ])
        }
        
        transform = augmentation_transforms.get(augmentation_type, augmentation_transforms['basic'])
        return transform(image)

# Global preprocessor instance
preprocessor = ImagePreprocessor()
