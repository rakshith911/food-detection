"""
Model Loading and Caching
Handles initialization of Florence-2, SAM2, Metric3D, and RAG system
"""
# CRITICAL: Patch transformers.utils BEFORE importing transformers
# Florence-2's custom code executes at import time and needs this function
# We must import transformers first to get the utils module, then patch it
# This MUST happen before ANY transformers imports, including AutoProcessor/AutoModelForCausalLM
import sys
import importlib

# Import transformers to get access to utils module
import transformers
import transformers.utils as transformers_utils

# Apply patch immediately - this MUST happen before Florence-2 custom code executes
if not hasattr(transformers_utils, 'is_flash_attn_greater_or_equal_2_10'):
    def is_flash_attn_greater_or_equal_2_10():
        """Check if flash_attn version >= 2.10. Returns False for CPU-only environments."""
        return False  # Always False for CPU, which is what we want
    transformers_utils.is_flash_attn_greater_or_equal_2_10 = is_flash_attn_greater_or_equal_2_10
    # Also patch it in the module's __dict__ to ensure it's available
    setattr(transformers_utils, 'is_flash_attn_greater_or_equal_2_10', is_flash_attn_greater_or_equal_2_10)
    print("✅ Applied monkey patch for is_flash_attn_greater_or_equal_2_10 in models.py")
    print(f"✅ Verified: hasattr check = {hasattr(transformers_utils, 'is_flash_attn_greater_or_equal_2_10')}")
else:
    print("✅ is_flash_attn_greater_or_equal_2_10 already exists in transformers.utils")

# CRITICAL: Import NumPy BEFORE PyTorch to ensure PyTorch can detect it
# PyTorch's torch.from_numpy() requires NumPy to be imported first
import numpy as np
print(f"✅ NumPy {np.__version__} imported before PyTorch in models.py")

import torch
from pathlib import Path
from typing import Optional, Dict, Any
from functools import lru_cache
import logging

from transformers import AutoProcessor, AutoModelForCausalLM
from sam2.build_sam import build_sam2_video_predictor

logger = logging.getLogger(__name__)


class ModelCache:
    """Singleton class to cache loaded models"""
    _instance = None
    _models = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get(self, key: str):
        return self._models.get(key)
    
    def set(self, key: str, model: Any):
        self._models[key] = model
    
    def clear(self):
        """Clear all cached models to free memory"""
        self._models.clear()
        torch.cuda.empty_cache()


# Global cache instance
model_cache = ModelCache()


def load_florence2(model_name: str = "microsoft/Florence-2-base-ft", device: str = "cuda") -> tuple:
    """
    Load Florence-2 model and processor
    
    Args:
        model_name: HuggingFace model name
        device: Device to load model on
        
    Returns:
        (processor, model) tuple
    """
    cache_key = f"florence2_{model_name}_{device}"
    cached = model_cache.get(cache_key)
    if cached:
        logger.info(f"Using cached Florence-2 model")
        return cached
    
    logger.info(f"Loading Florence-2 model: {model_name}...")
    
    processor = AutoProcessor.from_pretrained(
        model_name,
        trust_remote_code=True,
        cache_dir=None  # Use default HF cache
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        cache_dir=None,
        attn_implementation="eager"  # Use eager attention instead of flash_attn for CPU
    ).to(device)
    
    model.eval()
    
    result = (processor, model)
    model_cache.set(cache_key, result)
    
    logger.info(f"✓ Florence-2 loaded successfully")
    return result


def load_sam2(config_path: str, checkpoint_path: str, device: str = "cuda"):
    """
    Load SAM2 video predictor
    
    Args:
        config_path: Path to SAM2 config YAML
        checkpoint_path: Path to SAM2 checkpoint
        device: Device to load model on
        
    Returns:
        SAM2 video predictor
    """
    cache_key = f"sam2_{checkpoint_path}_{device}"
    cached = model_cache.get(cache_key)
    if cached:
        logger.info("Using cached SAM2 model")
        return cached
    
    logger.info(f"Loading SAM2 model: {checkpoint_path}...")
    
    predictor = build_sam2_video_predictor(
        config_file=config_path,
        ckpt_path=checkpoint_path,
        device=device
    )
    
    model_cache.set(cache_key, predictor)
    
    logger.info("✓ SAM2 loaded successfully")
    return predictor


def _find_decoder_recursive(module, visited=None):
    """Recursively find decoder module with get_bins method"""
    if visited is None:
        visited = set()
    
    module_id = id(module)
    if module_id in visited:
        return None
    visited.add(module_id)
    
    # Check if this module has get_bins method
    if hasattr(module, 'get_bins') and callable(getattr(module, 'get_bins')):
        return module
    
    # Recursively search child modules
    for name, child in module.named_children():
        result = _find_decoder_recursive(child, visited)
        if result is not None:
            return result
    
    return None


def _patch_torch_linspace_for_cpu():
    """
    Patch torch.linspace to automatically replace device="cuda" with device="cpu"
    when CUDA is not available. This fixes Metric3D's hardcoded CUDA usage.
    """
    if not torch.cuda.is_available():
        original_linspace = torch.linspace
        
        def patched_linspace(*args, device=None, **kwargs):
            """Patched torch.linspace that replaces CUDA with CPU when CUDA unavailable"""
            if device == "cuda" or (isinstance(device, torch.device) and device.type == "cuda"):
                device = "cpu"
            return original_linspace(*args, device=device, **kwargs)
        
        torch.linspace = patched_linspace
        logger.info("✓ Patched torch.linspace to replace CUDA with CPU")


def _patch_metric3d_for_cpu(model, device):
    """
    Patch Metric3D model to use CPU instead of hardcoded CUDA.
    Metric3D's decoder has hardcoded device="cuda" which fails on CPU-only systems.
    """
    if device == "cpu":
        # First, patch torch.linspace globally to intercept CUDA calls
        _patch_torch_linspace_for_cpu()
        
        # Get the actual device from the model
        model_device = next(model.parameters()).device
        logger.info(f"Patching Metric3D for CPU - model device: {model_device}")
        
        # Try to find decoder recursively
        decoder = _find_decoder_recursive(model)
        
        if decoder is None:
            # Fallback: try common paths
            if hasattr(model, 'depth_model'):
                if hasattr(model.depth_model, 'decoder'):
                    decoder = model.depth_model.decoder
                elif hasattr(model.depth_model, 'depth_model') and hasattr(model.depth_model.depth_model, 'decoder'):
                    decoder = model.depth_model.depth_model.decoder
        
        if decoder is not None and hasattr(decoder, 'get_bins'):
            # Store original for reference
            original_get_bins = decoder.get_bins
            
            def patched_get_bins(self, bins_num):
                """Patched version that uses model's device instead of hardcoded CUDA"""
                import math
                # Use the device of the model's parameters (should be CPU)
                try:
                    device_to_use = next(self.parameters()).device if list(self.parameters()) else torch.device('cpu')
                except:
                    device_to_use = torch.device('cpu')
                
                depth_bins_vec = torch.linspace(
                    math.log(self.min_val), 
                    math.log(self.max_val), 
                    bins_num, 
                    device=device_to_use
                )
                return depth_bins_vec
            
            # Bind the patched method to the decoder instance
            import types
            decoder.get_bins = types.MethodType(patched_get_bins, decoder)
            logger.info(f"✓ Patched Metric3D decoder.get_bins to use {model_device} instead of CUDA")
        else:
            logger.warning("⚠ Could not find Metric3D decoder with get_bins method - using torch.linspace patch as fallback")


def load_metric3d(model_name: str = "metric3d_vit_small", device: str = "cuda"):
    """
    Load Metric3D depth estimation model
    
    Args:
        model_name: Metric3D model variant
        device: Device to load model on
        
    Returns:
        Metric3D model
    """
    cache_key = f"metric3d_{model_name}_{device}"
    cached = model_cache.get(cache_key)
    if cached:
        logger.info("Using cached Metric3D model")
        return cached
    
    logger.info(f"Loading Metric3D model: {model_name}...")
    
    try:
        # CRITICAL: Patch torch.linspace BEFORE loading Metric3D
        # This intercepts all CUDA device calls and replaces with CPU
        if device == "cpu":
            _patch_torch_linspace_for_cpu()
        
        # Ensure NumPy is imported and available before loading Metric3D
        # Metric3D's torch.hub.load checks for NumPy availability
        import numpy as np
        assert np is not None, "NumPy must be available for Metric3D"
        logger.info(f"NumPy version: {np.__version__} - verified before Metric3D load")
        
        model = torch.hub.load(
            'yvanyin/metric3d',
            model_name,
            pretrain=True
        )
        # Force all components to the specified device
        model = model.to(device)
        # Also ensure all buffers and registered buffers are moved
        for name, buffer in model.named_buffers():
            buffer.data = buffer.data.to(device)
        
        # CRITICAL: Patch Metric3D to use CPU instead of hardcoded CUDA
        _patch_metric3d_for_cpu(model, device)
        
        model.eval()
        
        model_cache.set(cache_key, model)
        logger.info("✓ Metric3D loaded successfully")
        return model
        
    except Exception as e:
        logger.error(f"Failed to load Metric3D: {e}")
        raise


def load_nutrition_rag(
    pdf_path: Path,
    fndds_path: Path,
    cofid_path: Path,
    gemini_api_key: Optional[str] = None
):
    """
    Load and initialize Nutrition RAG system
    
    Args:
        pdf_path: Path to density PDF
        fndds_path: Path to FNDDS Excel
        cofid_path: Path to CoFID Excel
        gemini_api_key: Optional Gemini API key for fallback
        
    Returns:
        Initialized NutritionRAG instance
    """
    cache_key = "nutrition_rag"
    cached = model_cache.get(cache_key)
    if cached:
        logger.info("Using cached NutritionRAG system")
        return cached
    
    logger.info("Loading Nutrition RAG system...")
    
    # Import here to avoid circular dependency
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from nutrition_rag_system import NutritionRAG
    
    # Set Gemini API key if provided
    if gemini_api_key:
        import os
        os.environ['GEMINI_API_KEY'] = gemini_api_key
    
    rag = NutritionRAG(
        pdf_path=pdf_path,
        fndds_path=fndds_path,
        cofid_path=cofid_path
    )
    
    # Pre-load databases
    rag.extract_density_from_pdf()
    rag.load_calorie_databases()
    rag.build_faiss_index()
    
    model_cache.set(cache_key, rag)
    logger.info("✓ NutritionRAG loaded successfully")
    
    return rag


class ModelManager:
    """High-level model management interface"""
    
    def __init__(self, config):
        self.config = config
        self.device = config.DEVICE
        
        # Models will be loaded on demand
        self._florence2 = None
        self._sam2 = None
        self._metric3d = None
        self._rag = None
    
    @property
    def florence2(self):
        """Lazy load Florence-2"""
        if self._florence2 is None:
            self._florence2 = load_florence2(
                model_name=self.config.FLORENCE2_MODEL,
                device=self.device
            )
        return self._florence2
    
    @property
    def sam2(self):
        """Lazy load SAM2"""
        if self._sam2 is None:
            self._sam2 = load_sam2(
                config_path=self.config.SAM2_CONFIG,
                checkpoint_path=self.config.SAM2_CHECKPOINT,
                device=self.device
            )
        return self._sam2
    
    @property
    def metric3d(self):
        """Lazy load Metric3D"""
        if self._metric3d is None:
            self._metric3d = load_metric3d(
                model_name=self.config.METRIC3D_MODEL,
                device=self.device
            )
        return self._metric3d
    
    @property
    def rag(self):
        """Lazy load NutritionRAG"""
        if self._rag is None:
            self._rag = load_nutrition_rag(
                pdf_path=self.config.DENSITY_PDF_PATH,
                fndds_path=self.config.FNDDS_EXCEL_PATH,
                cofid_path=self.config.COFID_EXCEL_PATH,
                gemini_api_key=self.config.GEMINI_API_KEY
            )
        return self._rag
    
    def preload_all(self):
        """Preload all models (useful for container warmup)"""
        logger.info("Preloading all models...")
        _ = self.florence2
        _ = self.sam2
        _ = self.metric3d
        _ = self.rag
        logger.info("✓ All models preloaded")
    
    def clear_cache(self):
        """Clear all cached models"""
        self._florence2 = None
        self._sam2 = None
        self._metric3d = None
        self._rag = None
        model_cache.clear()
        logger.info("Model cache cleared")


# Test function
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    
    from config import settings
    
    logging.basicConfig(level=logging.INFO)
    
    print("Testing model loading...")
    
    manager = ModelManager(settings)
    
    # Test lazy loading
    print("\n1. Testing Florence-2 lazy load...")
    proc, model = manager.florence2
    print(f"   ✓ Florence-2: {type(model).__name__}")
    
    print("\n2. Testing SAM2 lazy load...")
    sam2 = manager.sam2
    print(f"   ✓ SAM2: {type(sam2).__name__}")
    
    print("\nDone!")

