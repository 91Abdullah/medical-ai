import time
import tensorflow as tf
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Tuple, Any
import logging
import os
from abc import ABC, abstractmethod
from torchvision.models import vit_b_16, resnet50, ViT_B_16_Weights
from architecture.mobilenetv3 import MobileNetV3LargeRegressor

logger = logging.getLogger(__name__)

class BaseModel(ABC):
    """Abstract base class for medical AI models."""
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        self.model_path = model_path
        self.device = device
        self.model = None
        self.is_loaded = False
        
    @abstractmethod
    def load_model(self) -> None:
        """Load the model from file."""
        pass
    
    @abstractmethod
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """Make prediction on input data."""
        pass
    
    def _to_device(self, tensor: torch.Tensor) -> torch.Tensor:
        """Move tensor to appropriate device."""
        return tensor.to(self.device)

class DROCTModel(BaseModel):
    """DR OCT multiclass classification model (Keras)."""

    def __init__(self, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        # This is a binary model p > 0.5 == Normal else DR
        self.classes = ['DR', 'Normal']

    def load_model(self):
        """Load DR OCT Keras model (.h5 or SavedModel)"""
        try:
            self.model = tf.keras.models.load_model(self.model_path)
            self.is_loaded = True
            logger.info(f"DR OCT model loaded successfully from {self.model_path}")
        except Exception as e:
            logger.error(f"Error loading DR OCT model: {e}")
            # Fallback to dummy model
            self.model = self._create_dummy_model()
            self.is_loaded = True

    def predict(self, input_data: np.ndarray) -> Dict[str, Any]:
        if not self.is_loaded:
            self.load_model()

        # Ensure batch and float32
        x = np.asarray(input_data, dtype="float32")
        if x.ndim == 3:  # (H, W, C) -> (1, H, W, C)
            x = x[None, ...]

        # Align channel count with model input (tile grayscale if model expects RGB)
        expected_c = int(self.model.inputs[0].shape[-1]) if self.model.inputs[0].shape[-1] is not None else x.shape[-1]
        if x.shape[-1] == 1 and expected_c == 3:
            x = np.repeat(x, 3, axis=-1)
        elif x.shape[-1] == 3 and expected_c == 1:
            x = x.mean(axis=-1, keepdims=True)

        # Inference
        y = self.model(x, training=False)
        y = y.numpy().squeeze()

        # Map outputs to probabilities for ['DR', 'Normal']
        if y.ndim == 0:                # scalar sigmoid
            p_normal = float(y)        # per your comment: p>0.5 => Normal
            probs = [1.0 - p_normal, p_normal]   # [DR, Normal]
        elif y.ndim == 1 and y.shape[0] == 1:  # (1,)
            p_normal = float(y[0])
            probs = [1.0 - p_normal, p_normal]
        elif y.ndim == 1 and y.shape[0] == 2:  # softmax/logits for 2 classes
            probs = tf.nn.softmax(y).numpy().tolist()
        else:
            raise ValueError(f"Unexpected model output shape: {y.shape}")

        idx = int(np.argmax(probs))
        return {
            "prediction": self.classes[idx],          # ['DR','Normal']
            "confidence": float(probs[idx]),
            "probabilities": {c: float(p) for c, p in zip(self.classes, probs)},
            "classes": self.classes
    }

class DRFundusModel(BaseModel):
    """DR Fundus multiclass classification model."""

    def __init__(self, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        self.classes = ['No DR', 'Early pathology', 'Advanced pathology']

    def load_model(self):
        """Load DR Fundus PyTorch Model (.pth)."""
        try:
            self.model = torch.load(self.model_path, weights_only=False, map_location=self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info(f"DR Fundus model loaded successfully from {self.model_path}")

        except Exception as e:
            logger.error(f"Error loading DR Fundus model: {e}")
            # Fallback to dummy model
            self.model = self._create_dummy_model()
            self.is_loaded = True
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """Predict DR stage from Fundus image."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            print(input_data.shape)
            input_data = self._to_device(input_data)
            with torch.no_grad():
                outputs = self.model(input_data)
                probabilities = torch.softmax(outputs, dim=1)
                predicted_class = torch.argmax(probabilities, dim=1)
                confidence = torch.max(probabilities, dim=1)[0]
            
            prediction = self.classes[predicted_class.item()]
            confidence_score = confidence.item()
            
            # Calculate margin-based confidence (similar to the sample code)
            sorted_probs, _ = torch.sort(probabilities, descending=True, dim=1)
            margin_confidence = (sorted_probs[0][0] - sorted_probs[0][1]).item()
            
            return {
                'prediction': prediction,
                'confidence': margin_confidence,
                'probabilities': probabilities.cpu().numpy()[0].tolist(),
                'classes': self.classes
            }
            
        except Exception as e:
            logger.error(f"Error during DR Fundus prediction: {e}")
            return {
                'prediction': 'No DR',
                'confidence': 0.0,
                'probabilities': [1.0, 0.0, 0.0],
                'classes': self.classes
            }
    
    def _create_dummy_model(self):
        """Create a dummy model for testing."""
        class DummyModel(nn.Module):
            def forward(self, x):
                batch_size = x.size(0)
                return torch.randn(batch_size, 3)
        return DummyModel()

class AMDOCTModel(BaseModel):
    """AMD OCT multiclass classification model."""
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        self.classes = ['Control', 'Early', 'Intermediate', 'Late']
        
    def load_model(self) -> None:
        """Load AMD OCT PyTorch model (.pt)."""
        try:
            NUM_CLASSES = 4
            DROPOUT = 0.2
            self.model = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
            in_f = self.model.heads.head.in_features  # 768
            self.model.heads.head = nn.Sequential(nn.Dropout(DROPOUT), nn.Linear(in_f, NUM_CLASSES))
            state = torch.load(self.model_path, map_location=self.device)
            self.model.load_state_dict(state['model_state'])
            self.model.eval()
            self.is_loaded = True
            logger.info(f"AMD OCT model loaded successfully from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error loading AMD OCT model: {e}")
            # Fallback to dummy model
            self.model = self._create_dummy_model()
            self.is_loaded = True
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """Predict AMD stage from OCT image."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            input_data = self._to_device(input_data)
            
            with torch.no_grad():
                outputs = self.model(input_data)
                probabilities = torch.softmax(outputs, dim=1)
                predicted_class = torch.argmax(probabilities, dim=1)
                confidence = torch.max(probabilities, dim=1)[0]
            
            prediction = self.classes[predicted_class.item()]
            confidence_score = confidence.item()
            
            return {
                'prediction': prediction,
                'confidence': confidence_score,
                'class_probabilities': {
                    cls: float(prob) for cls, prob in 
                    zip(self.classes, probabilities[0].cpu().numpy())
                }
            }
            
        except Exception as e:
            logger.error(f"Error in AMD OCT prediction: {e}")
            # Return default prediction for demo
            return {
                'prediction': 'Normal',
                'confidence': 0.85,
                'class_probabilities': {
                    'Normal': 0.85,
                    'Early AMD': 0.10,
                    'Intermediate AMD': 0.03,
                    'Advanced AMD': 0.02
                }
            }
    
    def _create_dummy_model(self):
        """Create a dummy model for demonstration."""
        model = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(3, len(self.classes))
        )
        return model

class AMDFundusModel(BaseModel):
    """AMD Fundus binary classification model."""

    def __init__(self, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        self.classes = ['No AMD', 'AMD Present']

    # ---------- helpers ----------

    @staticmethod
    def _extract_state_dict(ckpt: Dict[str, Any]) -> Dict[str, torch.Tensor]:
        """Return the tensor map from a generic checkpoint dict."""
        if isinstance(ckpt, dict):
            for k in ("model_state", "state_dict", "weights", "model"):
                if k in ckpt and isinstance(ckpt[k], dict):
                    return ckpt[k]
        # If the file itself is a bare state_dict
        return ckpt

    @staticmethod
    def _strip_module_prefix(state: Dict[str, torch.Tensor], prefix: str = "module.") -> Dict[str, torch.Tensor]:
        if any(k.startswith(prefix) for k in state.keys()):
            return {k[len(prefix):]: v for k, v in state.items()}
        return state

    # ---------- model lifecycle ----------

    def load_model(self) -> None:
        """Load AMD Fundus PyTorch model (.pth/.pt)."""
        try:
            if not os.path.exists(self.model_path):
                logger.warning(f"Model file not found: {self.model_path}")
                self.model = self._create_dummy_model()
            else:
                ckpt = torch.load(self.model_path, map_location=self.device)
                state = self._extract_state_dict(ckpt)
                state = self._strip_module_prefix(state)

                # Build a fresh resnet50 backbone
                self.model = resnet50(weights=None)

                # Decide classifier head:
                # If checkpoint includes a classifier weight shape, respect it; else default to 1-logit (sigmoid).
                fc_in = self.model.fc.in_features

                # Try to infer out_features from checkpoint if present
                out_features = None
                # common keys for resnet fc
                for key in ("fc.weight", "module.fc.weight"):
                    if key in state:
                        out_features = state[key].shape[0]
                        break
                # Fallback: if class_to_idx is present, use its length; otherwise default to binary (1 logit)
                if out_features is None:
                    if isinstance(ckpt, dict) and isinstance(ckpt.get("class_to_idx"), dict):
                        n_classes = len(ckpt["class_to_idx"])
                        out_features = 1 if n_classes == 2 else n_classes
                    else:
                        out_features = 1

                self.model.fc = nn.Linear(fc_in, out_features)

                # Load weights (strict first, then relax if needed)
                try:
                    self.model.load_state_dict(state, strict=True)
                except RuntimeError as e:
                    logger.warning(f"Strict load failed ({e}). Retrying with strict=False.")
                    missing, unexpected = self.model.load_state_dict(state, strict=False)
                    if missing:
                        logger.warning(f"Missing keys: {missing}")
                    if unexpected:
                        logger.warning(f"Unexpected keys: {unexpected}")

            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info(f"AMD Fundus model loaded successfully from {self.model_path}")

        except Exception as e:
            logger.error(f"Error loading AMD Fundus model: {e}")
            self.model = self._create_dummy_model()
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True

    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """Predict AMD presence from fundus image."""
        try:
            if not self.is_loaded:
                self.load_model()

            x = self._to_device(input_data)

            with torch.no_grad():
                logits = self.model(x)  # shape [N, C] where C is 1 or 2
                if logits.ndim == 1:
                    logits = logits.unsqueeze(1)

                if logits.shape[1] == 1:
                    # Binary with single logit
                    prob_pos = torch.sigmoid(logits).squeeze(1)  # P(class=1)
                    pred_idx = (prob_pos > 0.5).long()
                    probability = prob_pos
                else:
                    # Two (or more) logits — use softmax
                    probs = F.softmax(logits, dim=1)
                    pred_idx = probs.argmax(dim=1)
                    # If we have exactly 2 classes, report probability of "AMD Present" (index 1)
                    if probs.shape[1] >= 2:
                        probability = probs[:, 1]
                    else:
                        probability = probs.gather(1, pred_idx.unsqueeze(1)).squeeze(1)

            # Assume batch size 1
            idx = int(pred_idx.item())
            prob = float(probability.item())

            if len(self.classes) > idx:
                prediction = self.classes[idx]
            else:
                prediction = str(idx)

            # Confidence: if predicted class==1, conf=prob; else conf=1-prob (for binary)
            if logits.shape[1] == 1 or logits.shape[1] == 2:
                confidence = prob if idx == 1 else 1 - prob
            else:
                confidence = prob  # multi-class best-prob

            return {
                'prediction': prediction,
                'confidence': float(confidence),
                'probability': float(prob),  # P(AMD Present) if binary; best class prob otherwise
            }

        except Exception as e:
            logger.error(f"Error in AMD Fundus prediction: {e}")
            return {
                'prediction': 'No AMD',
                'confidence': 0.92,
                'probability': 0.08
            }

    def _create_dummy_model(self):
        """Create a dummy model for demonstration."""
        model = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(3, 1)
        )
        return model

class GlaucomaFundusModel(BaseModel):
    """Glaucoma Fundus classification model (Keras/TensorFlow)."""
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        self.classes = ['Glaucoma Suspected', 'No Glaucoma']
        self.tf_model = None
        
    def load_model(self) -> None:
        """Load Glaucoma Keras model (.keras)."""
        try:
            import tensorflow as tf
            
            if not os.path.exists(self.model_path):
                logger.warning(f"Model file not found: {self.model_path}")
                self.tf_model = self._create_dummy_tf_model()
            else:
                self.tf_model = tf.keras.models.load_model(self.model_path)
            
            self.is_loaded = True
            logger.info(f"Glaucoma model loaded successfully from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error loading Glaucoma model: {e}")
            # Create dummy TensorFlow model
            import tensorflow as tf
            self.tf_model = self._create_dummy_tf_model()
            self.is_loaded = True
    
    def predict(self, input_data: np.ndarray) -> Dict[str, Any]:
        """Predict glaucoma from fundus image."""
        try:        
            if not self.is_loaded:
                self.load_model()

            # Ensure numpy float32 and a batch
            x = np.asarray(input_data, dtype="float32")
            if x.ndim == 3:  # (H, W, 3) -> (1, H, W, 3)
                x = np.expand_dims(x, 0)

            # Hard assertions since you said it's already Keras-ready
            if x.ndim != 4 or x.shape[-1] != 3:
                raise ValueError(f"Expected NHWC with 3 channels, got shape {x.shape}")

            # Inference (faster than .predict in request path)
            y = self.tf_model(x, training=False)
            probs = y.numpy()[0] if hasattr(y, "numpy") else np.array(y)[0]

            # Softmax only if needed
            if probs.min() < 0 or probs.max() > 1.0 or not np.isclose(probs.sum(), 1.0, atol=1e-3):
                probs = tf.nn.softmax(probs).numpy()

            idx = int(np.argmax(probs))
            return {
                "prediction": self.classes[idx],
                "confidence": float(probs[idx]),
                "class_probabilities": {c: float(p) for c, p in zip(self.classes, probs)},
            }
            
        except Exception as e:
            logger.error(f"Error in Glaucoma prediction: {e}")
            return {
                'prediction': 'No Glaucoma',
                'confidence': 0.88,
                'class_probabilities': {
                    'No Glaucoma': 0.88,
                    'Glaucoma Suspected': 0.08,
                    'Glaucoma': 0.04
                }
            }
    
    def _create_dummy_tf_model(self):
        """Create a dummy TensorFlow model for demonstration."""
        import tensorflow as tf
        
        model = tf.keras.Sequential([
            tf.keras.layers.GlobalAveragePooling2D(input_shape=(224, 224, 3)),
            tf.keras.layers.Dense(len(self.classes), activation='softmax')
        ])
        
        # Compile the model
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        
        return model

class BiomarkerModel(BaseModel):
    """Biomarker prediction model."""
    
    # Biomarker configurations with normal ranges and units
    BIOMARKER_CONFIG = {
        'Age': {'unit': 'years', 'normal_range': '18-80', 'scale_factor': 1.0},
        'BMI': {'unit': 'kg/m^2', 'normal_range': '18.5-24.9', 'scale_factor': 1.0},

        'BP_OUT_CALC_AVG_DIASTOLIC_BP': {'unit': 'mmHg', 'normal_range': '60-80', 'scale_factor': 1.0},
        'BP_OUT_CALC_AVG_SYSTOLIC_BP': {'unit': 'mmHg', 'normal_range': '90-120', 'scale_factor': 1.0},

        # Lipid profile — mmol/L
        'Cholesterol Total': {'unit': 'mmol/L', 'normal_range': '<5.2', 'scale_factor': 1.0},            # <200 mg/dL → <5.2 mmol/L
        'HDL-Cholesterol': {'unit': 'mmol/L', 'normal_range': '>1.0 (M), >1.3 (F)', 'scale_factor': 1.0},# >40/50 mg/dL → >1.0/1.3 mmol/L
        'LDL-Cholesterol Calc': {'unit': 'mmol/L', 'normal_range': '<2.6', 'scale_factor': 1.0},          # <100 mg/dL → <2.6 mmol/L
        'Triglyceride': {'unit': 'mmol/L', 'normal_range': '<1.7', 'scale_factor': 1.0},                  # <150 mg/dL → <1.7 mmol/L

        # Metabolic — mmol/L, %, mcunit/mL
        'Glucose': {'unit': 'mmol/L', 'normal_range': '3.9-5.6', 'scale_factor': 1.0},                    # 70-100 mg/dL → 3.9-5.6 mmol/L
        'HbA1C %': {'unit': '%', 'normal_range': '<5.7', 'scale_factor': 1.0},
        'Insulin': {'unit': 'mcunit/mL', 'normal_range': '2.6-24.9', 'scale_factor': 1.0},                # matches table wording

        # Blood parameters
        'Hematocrit': {'unit': '%', 'normal_range': '36-46 (F), 41-50 (M)', 'scale_factor': 1.0},
        'Hemoglobin': {'unit': 'g/dL', 'normal_range': '12-15.5 (F), 13.5-17.5 (M)', 'scale_factor': 1.0},
        'Red Blood Cell': {'unit': 'x10^6/µL', 'normal_range': '4.0-5.2 (F), 4.7-6.1 (M)', 'scale_factor': 1.0},

        # Kidney function — µmol/L
        'Creatinine': {'unit': 'µmol/L', 'normal_range': '53-115', 'scale_factor': 1.0},                  # 0.6-1.3 mg/dL → 53-115 µmol/L

        # Hormones — nmol/L / pmol/L
        'Sex Hormone Binding Globulin': {'unit': 'nmol/L', 'normal_range': '18-144', 'scale_factor': 1.0},
        'Estradiol': {'unit': 'pmol/L', 'normal_range': '55-1285', 'scale_factor': 1.0},                  # 15-350 pg/mL → 55-1285 pmol/L
        'Testosterone Total': {'unit': 'nmol/L', 'normal_range': '10-35 (M), 0.5-2.4 (F)', 'scale_factor': 1.0}  # 300-1000 / 15-70 ng/dL
    }
    
    def __init__(self, biomarker_name: str, model_path: str, device: str = 'cpu'):
        super().__init__(model_path, device)
        self.biomarker_name = biomarker_name
        self.config = self.BIOMARKER_CONFIG.get(biomarker_name, {})
        
    def load_model(self) -> None:
        """Load biomarker PyTorch model (.pth)."""
        try:
            if not os.path.exists(self.model_path):
                logger.warning(f"Biomarker model file not found: {self.model_path}")
                self.model = self._create_dummy_model()
            else:
                self.model = MobileNetV3LargeRegressor()
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            
            self.model.eval()
            self.is_loaded = True
            logger.info(f"Biomarker model for {self.biomarker_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading biomarker model for {self.biomarker_name}: {e}")
            self.model = self._create_dummy_model()
            self.is_loaded = True
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """Predict biomarker value from retinal image."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            input_data = self._to_device(input_data)
            
            with torch.no_grad():
                output = self.model(input_data)
                predicted_value = output.item()
                
                # Apply scaling if configured
                scale_factor = self.config.get('scale_factor', 1.0)
                predicted_value *= scale_factor
            
            return {
                'biomarker_name': self.biomarker_name,
                'predicted_value': round(predicted_value, 2),
                'unit': self.config.get('unit', ''),
                'normal_range': self.config.get('normal_range', 'N/A'),
                'confidence': 0.85,  # Dummy confidence for demo
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
            }
            
        except Exception as e:
            logger.error(f"Error in biomarker prediction for {self.biomarker_name}: {e}")
            # Return dummy values based on biomarker type
            return self._get_dummy_prediction()
    
    def _create_dummy_model(self):
        """Create a dummy model for demonstration."""
        model = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(3, 1)
        )
        return model
    
    def _get_dummy_prediction(self) -> Dict[str, Any]:
        """Generate dummy prediction values for demonstration."""
        dummy_values = {
            'Age': 45.2,
            'BMI': 23.5,
            'BP_OUT_CALC_AVG_DIASTOLIC_BP': 72.0,
            'BP_OUT_CALC_AVG_SYSTOLIC_BP': 118.0,
            'Cholesterol Total': 185.0,
            'Creatinine': 0.9,
            'Estradiol': 150.0,
            'Glucose': 95.0,
            'HbA1C %': 5.2,
            'HDL-Cholesterol': 55.0,
            'Hematocrit': 42.0,
            'Hemoglobin': 14.2,
            'Insulin': 12.5,
            'LDL-Cholesterol Calc': 95.0,
            'Red Blood Cell': 4.8,
            'Sex Hormone Binding Globulin': 45.0,
            'Testosterone Total': 450.0,
            'Triglyceride': 120.0
        }
        
        predicted_value = dummy_values.get(self.biomarker_name, 50.0)
        
        return {
            'biomarker_name': self.biomarker_name,
            'predicted_value': predicted_value,
            'unit': self.config.get('unit', ''),
            'normal_range': self.config.get('normal_range', 'N/A'),
            'confidence': 0.85
        }
