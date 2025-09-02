from .model_service import AMDOCTModel, AMDFundusModel, DROCTModel, GlaucomaFundusModel, BiomarkerModel, DRFundusModel, GlaucomaOCTModel
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ModelManager:
    """Centralized model management for loading and caching models."""
    
    def __init__(self, models_dir: str, device: str = 'cpu'):
        self.models_dir = models_dir
        self.device = device
        self.loaded_models = {}
        self._ensure_models_dir()
    
    def _ensure_models_dir(self):
        """Ensure models directory exists."""
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)
            logger.info(f"Created models directory: {self.models_dir}")
    
    def get_amd_oct_model(self) -> AMDOCTModel:
        """Get or load AMD OCT model."""
        model_key = 'amd_oct'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'best_f1.pt')
            self.loaded_models[model_key] = AMDOCTModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_amd_fundus_model(self) -> AMDFundusModel:
        """Get or load AMD Fundus model."""
        model_key = 'amd_fundus'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'AMD_Fundus_Binary_calssifier_Model_resnet50.pth')
            self.loaded_models[model_key] = AMDFundusModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_glaucoma_model(self) -> GlaucomaFundusModel:
        """Get or load Glaucoma model."""
        model_key = 'glaucoma'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'best.keras')
            self.loaded_models[model_key] = GlaucomaFundusModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_glaucoma_oct_model(self) -> GlaucomaOCTModel:
        """Get or load Glaucoma OCT model."""
        model_key = 'glaucoma_oct'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'glaucoma_oct.pt')
            self.loaded_models[model_key] = GlaucomaOCTModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_dr_model(self) -> DRFundusModel:
        """Get or load DR model."""
        model_key = 'dr'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'model_fold1_acc0.8734.pth')
            self.loaded_models[model_key] = DRFundusModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_dr_oct_model(self) -> DROCTModel:
        """Get or load DR OCT model."""
        model_key = 'dr_oct'
        if model_key not in self.loaded_models:
            model_path = os.path.join(self.models_dir, 'my_model.h5')
            self.loaded_models[model_key] = DROCTModel(model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]

    def get_biomarker_model(self, biomarker_name: str) -> BiomarkerModel:
        """Get or load biomarker model."""
        model_key = f'biomarker_{biomarker_name}'
        if model_key not in self.loaded_models:
            # Replace spaces and special characters for filename
            filename = biomarker_name.replace(' ', '_').replace('%', 'pct').replace('-', '_')
            model_path = os.path.join(self.models_dir, f'{filename}/mobilenetv3large_regressor_best.pth')
            self.loaded_models[model_key] = BiomarkerModel(biomarker_name, model_path, self.device)
            self.loaded_models[model_key].load_model()
        return self.loaded_models[model_key]
    
    def get_loaded_models_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about loaded models."""
        info = {}
        for key, model in self.loaded_models.items():
            info[key] = {
                'model_type': type(model).__name__,
                'model_path': model.model_path,
                'is_loaded': model.is_loaded,
                'device': model.device
            }
        return info
    
    def unload_model(self, model_key: str) -> bool:
        """Unload a specific model to free memory."""
        if model_key in self.loaded_models:
            del self.loaded_models[model_key]
            logger.info(f"Unloaded model: {model_key}")
            return True
        return False
    
    def unload_all_models(self) -> None:
        """Unload all models to free memory."""
        self.loaded_models.clear()
        logger.info("Unloaded all models")

# Global model manager instance (to be initialized in app factory)
model_manager = None

def init_model_manager(models_dir: str, device: str = 'cpu'):
    """Initialize global model manager."""
    global model_manager
    model_manager = ModelManager(models_dir, device)
    logger.info(f"Model manager initialized with models_dir: {models_dir}, device: {device}")

def get_model_manager() -> ModelManager:
    """Get the global model manager instance."""
    if model_manager is None:
        raise RuntimeError("Model manager not initialized. Call init_model_manager() first.")
    return model_manager
