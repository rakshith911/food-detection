#!/usr/bin/env python3
"""
Simple script to run the nutrition pipeline on an image
Uses the code from app/ directory
"""
import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import Settings
from app.models import ModelManager
from app.pipeline import NutritionVideoPipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_pipeline.py <media_path>")
        print("Example: python run_pipeline.py /path/to/image.jpg")
        print("Example: python run_pipeline.py /path/to/video.mp4")
        sys.exit(1)
    
    image_path_str = sys.argv[1]
    image_path = Path(image_path_str)
    
    # Handle both absolute and relative paths
    if not image_path.exists():
        # Try resolving relative to script directory
        script_dir = Path(__file__).parent
        alt_path = script_dir / image_path_str
        if alt_path.exists():
            image_path = alt_path
        else:
            # Try as absolute path
            image_path = Path(image_path_str).resolve()
            if not image_path.exists():
                print(f"Error: Media file not found: {image_path_str}")
                print(f"  Tried: {Path(image_path_str)}")
                print(f"  Tried: {script_dir / image_path_str}")
                print(f"  Tried: {Path(image_path_str).resolve()}")
                sys.exit(1)
    
    # Detect media type
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv']
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff']
    
    file_ext = image_path.suffix.lower()
    is_video = file_ext in video_extensions
    is_image = file_ext in image_extensions
    
    if not is_video and not is_image:
        print(f"Warning: Unknown file type '{file_ext}', treating as image")
        is_image = True
    
    media_type = "Video" if is_video else "Image"
    
    print("=" * 60)
    print(f"Nutrition Pipeline - Processing {media_type}")
    print("=" * 60)
    print(f"{media_type}: {image_path}")
    print()
    
    # Initialize config
    print("1. Loading configuration...")
    config = Settings()
    config.DEVICE = os.environ.get('DEVICE', 'cpu')
    # Override caption_type from environment variable if set
    if 'CAPTION_TYPE' in os.environ:
        config.caption_type = os.environ.get('CAPTION_TYPE')
        print(f"   Using caption_type from environment: {config.caption_type}")
    
    # Fix paths for local execution (not Docker)
    script_dir = Path(__file__).parent
    if not Path(config.OUTPUT_DIR).exists():
        # Use local paths instead of /app paths
        config.OUTPUT_DIR = script_dir / "data" / "outputs"
        config.UPLOAD_DIR = script_dir / "data" / "uploads"
        config.DENSITY_PDF_PATH = script_dir / "data" / "rag" / "ap815e.pdf"
        config.FNDDS_EXCEL_PATH = script_dir / "data" / "rag" / "FNDDS.xlsx"
        config.COFID_EXCEL_PATH = script_dir / "data" / "rag" / "CoFID.xlsx"
        config.SAM2_CHECKPOINT = script_dir / "checkpoints" / "sam2.1_hiera_base_plus.pt"
        config.SAM2_CONFIG = script_dir / "sam2" / "configs" / "sam2.1" / "sam2.1_hiera_b+.yaml"
    
    # Create output directory
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"   Device: {config.DEVICE}")
    print(f"   Output Dir: {config.OUTPUT_DIR}")
    
    # Initialize models
    print("\n2. Loading AI models (this may take several minutes)...")
    print("   Note: Models load on-demand (lazy loading)")
    print("   - Florence-2 will load when detecting objects")
    print("   - SAM2 will load when tracking objects")
    print("   - Metric3D will load when estimating depth")
    print("   - RAG will load when analyzing nutrition")
    print("   First model load may take 2-5 minutes...")
    sys.stdout.flush()  # Force output
    
    model_manager = ModelManager(config)
    print("   ✓ Model manager initialized (models will load on demand)")
    
    # Initialize pipeline
    print("\n3. Initializing pipeline...")
    pipeline = NutritionVideoPipeline(model_manager, config)
    print("   ✓ Pipeline ready")
    
    # Process media
    print(f"\n4. Processing {media_type.lower()}...")
    job_id = f"run-{os.urandom(4).hex()}"
    
    if is_video:
        results = pipeline.process_video(image_path, job_id)
    else:
        results = pipeline.process_image(image_path, job_id)
    
    # Print results
    print("\n" + "=" * 60)
    print("Results")
    print("=" * 60)
    
    nutrition = results.get('nutrition', {})
    items = nutrition.get('items', [])
    
    if items:
        print(f"\nDetected {len(items)} food items:\n")
        for i, item in enumerate(items, 1):
            # Use food_name (from RAG) or fallback to matched_food or label
            name = item.get('food_name') or item.get('matched_food') or item.get('name', 'Unknown')
            calories = item.get('total_calories', 'N/A')
            volume = item.get('volume_ml', 'N/A')
            mass = item.get('mass_g', 'N/A')
            source = item.get('calorie_source', 'N/A')
            print(f"  {i}. {name}")
            print(f"     Calories: {calories} kcal (source: {source})")
            print(f"     Mass: {mass:.1f} g" if isinstance(mass, (int, float)) else f"     Mass: {mass}")
            print(f"     Volume: {volume} ml")
            print()
    else:
        print("\nNo food items detected.")
    
    summary = nutrition.get('summary', {})
    if summary:
        print("Meal Summary:")
        print(f"  Total Calories: {summary.get('total_calories_kcal', 'N/A')} kcal")
        print(f"  Total Mass: {summary.get('total_mass_g', 'N/A')} g")
        print(f"  Total Volume: {summary.get('total_food_volume_ml', 'N/A')} ml")
        print(f"  Food Items: {summary.get('num_food_items', 0)}")
    
    print("\n" + "=" * 60)
    print("✓ Processing complete!")
    print("=" * 60)
    
    # Save results
    output_file = Path(__file__).parent / "results.json"
    import json
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nFull results saved to: {output_file}")

if __name__ == "__main__":
    main()

