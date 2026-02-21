#!/usr/bin/env python3
"""
Unit test: _analyze_nutrition uses Gemini mass + calories and skips RAG when both are present.
No heavy models or API calls; only tests the logic.
"""
import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).parent))

def test_gemini_nutrition_skips_rag():
    from app.config import Settings
    from app.pipeline import NutritionVideoPipeline

    # No GEMINI_API_KEY so we skip _deduplicate_and_combine_with_gemini (only testing nutrition branch)
    config = Settings(GEMINI_API_KEY=None, USE_GEMINI_DETECTION=True)
    config.OUTPUT_DIR = Path(__file__).parent / "data" / "outputs"
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Mock model manager so we don't load RAG/SAM2/etc.
    mock_models = MagicMock()
    mock_rag = MagicMock()
    mock_models.rag = mock_rag

    pipeline = NutritionVideoPipeline(mock_models, config)

    # Tracking results with one item that has both Gemini mass and Gemini calories
    tracking_results = {
        "objects": {
            "ID1_almonds": {
                "label": "almonds",
                "statistics": {
                    "max_volume_ml": 50.0,
                    "gemini_grams_g": 15.0,
                    "gemini_kcal": 90.0,
                    "quantity": 15,
                },
            },
        },
    }

    result = pipeline._analyze_nutrition(tracking_results, "test-job")

    # RAG should not have been called (we had both mass and calories from Gemini)
    mock_rag.get_nutrition_for_food.assert_not_called()

    items = result["items"]
    assert len(items) == 1, f"Expected 1 item, got {len(items)}"
    item = items[0]
    assert item["calorie_source"] == "gemini", f"Expected calorie_source=gemini, got {item.get('calorie_source')}"
    assert item["mass_g"] == 15.0, f"Expected mass_g=15, got {item['mass_g']}"
    assert item["total_calories"] == 90.0, f"Expected total_calories=90, got {item['total_calories']}"
    assert item["food_name"] == "almonds"
    assert result["summary"]["total_calories_kcal"] == 90.0
    assert result["summary"]["total_mass_g"] == 15.0

    print("PASS: Gemini nutrition path used; RAG was not called.")


def test_mixed_gemini_and_rag():
    """When only gemini_kcal is present (no mass), we still call RAG for mass then override calories."""
    from app.config import Settings
    from app.pipeline import NutritionVideoPipeline

    config = Settings(GEMINI_API_KEY=None)
    config.OUTPUT_DIR = Path(__file__).parent / "data" / "outputs"
    mock_models = MagicMock()
    mock_rag = MagicMock()
    mock_rag.get_nutrition_for_food.return_value = {
        "food_name": "salad",
        "quantity": 1,
        "volume_ml": 100.0,
        "mass_g": 80.0,
        "total_calories": 20.0,
        "calories_per_100g": 25.0,
        "calorie_source": "FNDDS",
        "density_g_per_ml": 0.8,
        "density_source": "fallback",
        "density_similarity": 0.5,
        "calorie_similarity": 0.5,
        "matched_food": "salad",
    }
    mock_models.rag = mock_rag

    pipeline = NutritionVideoPipeline(mock_models, config)
    tracking_results = {
        "objects": {
            "ID1_salad": {
                "label": "salad",
                "statistics": {
                    "max_volume_ml": 100.0,
                    "gemini_grams_g": None,  # no mass from Gemini
                    "gemini_kcal": 30.0,    # but we have calories from Gemini
                    "quantity": 1,
                },
            },
        },
    }

    result = pipeline._analyze_nutrition(tracking_results, "test-job")
    mock_rag.get_nutrition_for_food.assert_called_once()
    items = result["items"]
    assert len(items) == 1
    assert items[0]["total_calories"] == 30.0
    assert items[0]["calorie_source"] == "gemini"

    print("PASS: Mixed path (RAG for mass, Gemini calories override) works.")


if __name__ == "__main__":
    test_gemini_nutrition_skips_rag()
    test_mixed_gemini_and_rag()
    print("\nAll tests passed.")
