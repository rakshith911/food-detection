#!/usr/bin/env python3
"""
Quick test: run pipeline on one image and verify Gemini nutrition (mass + calories)
is used when present (calorie_source='gemini') and RAG is skipped for those items.
"""
import os
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_gemini_nutrition.py <image_path>")
        print("Example: python test_gemini_nutrition.py /path/to/food.jpg")
        sys.exit(1)

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)

    if not os.environ.get("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY not set. Set it for Gemini detection and nutrition.")
        print("  export GEMINI_API_KEY='your-key'")

    from app.config import Settings
    from app.models import ModelManager
    from app.pipeline import NutritionVideoPipeline

    print("Loading config and pipeline...")
    config = Settings()
    config.DEVICE = os.environ.get("DEVICE", "cpu")
    script_dir = Path(__file__).parent
    if not Path(config.OUTPUT_DIR).exists():
        config.OUTPUT_DIR = script_dir / "data" / "outputs"
        config.UPLOAD_DIR = script_dir / "data" / "uploads"
        config.DENSITY_PDF_PATH = script_dir / "data" / "rag" / "ap815e.pdf"
        config.FNDDS_EXCEL_PATH = script_dir / "data" / "rag" / "FNDDS.xlsx"
        config.COFID_EXCEL_PATH = script_dir / "data" / "rag" / "CoFID.xlsx"
        config.SAM2_CHECKPOINT = script_dir / "checkpoints" / "sam2.1_hiera_base_plus.pt"
        config.SAM2_CONFIG = script_dir / "sam2" / "configs" / "sam2.1" / "sam2.1_hiera_b+.yaml"
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model_manager = ModelManager(config)
    pipeline = NutritionVideoPipeline(model_manager, config)

    job_id = f"test-{os.urandom(4).hex()}"
    print(f"Processing image: {image_path} (job_id={job_id})...")
    results = pipeline.process_image(image_path, job_id)

    nutrition = results.get("nutrition", {})
    items = nutrition.get("items", [])
    summary = nutrition.get("summary", {})

    print("\n--- Nutrition results ---")
    if not items:
        print("No food items detected.")
        return 0

    gemini_count = sum(1 for i in items if i.get("calorie_source") == "gemini")
    print(f"Items: {len(items)} total, {gemini_count} from Gemini (no RAG)")
    for i, item in enumerate(items, 1):
        name = item.get("food_name") or item.get("matched_food") or "?"
        cal = item.get("total_calories")
        mass = item.get("mass_g")
        src = item.get("calorie_source", "N/A")
        print(f"  {i}. {name}: {cal} kcal, {mass} g (source: {src})")
    print(f"Total: {summary.get('total_calories_kcal')} kcal, {summary.get('total_mass_g')} g")

    # Save for inspection
    out = script_dir / "test_gemini_nutrition_result.json"
    with open(out, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nFull results: {out}")

    if gemini_count > 0:
        print("\nPASS: At least one item used Gemini nutrition (no RAG).")
    else:
        print("\nNote: No items had calorie_source=gemini (RAG or fallback was used).")
    return 0

if __name__ == "__main__":
    sys.exit(main())
