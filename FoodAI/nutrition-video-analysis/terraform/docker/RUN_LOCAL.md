# Run Pipeline Locally (No Docker)

## Step 1: Install Dependencies

**Run this in your terminal** (takes 10-15 minutes):

```bash
cd /Users/leo/FoodProject/food-detection/FoodAI/nutrition-video-analysis/terraform/docker

# Option A: Use the install script
bash install_local.sh

# Option B: Manual installation
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install "numpy==1.24.3"
pip install torch==2.1.0 torchvision==0.16.0
pip install -r requirements.txt
```

**Note:** PyTorch is ~500MB, will take 5-10 minutes to download.

## Step 2: Check Installation

```bash
source venv/bin/activate
python3 check_install_progress.py
```

Should show: `22/22 packages (100%)`

## Step 3: Run Pipeline

**Image:**
```bash
source venv/bin/activate
python3 run_pipeline.py /path/to/image.jpg
```

**Video (same script, pass a video file):**
```bash
source venv/bin/activate
# Optional: set for Gemini one-shot video detection (recommended for video)
export GEMINI_API_KEY="your-key"

python3 run_pipeline.py /path/to/video.mov
# Or use the helper script:
./run_video_local.sh /path/to/video.mov
```

Supported video formats: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`. Results are written to `results.json` in the docker directory.

## What You'll See

1. Loading configuration...
2. Loading AI models... (models load on-demand)
3. Processing image...
4. 🔍 Detecting objects... (30-60 seconds on CPU)
5. 🍎 Analyzing nutrition...
6. Results with detected foods and calories

## Troubleshooting

### "Module not found"
- Make sure venv is activated: `source venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

### "Checkpoint not found"
- SAM2 checkpoint should be in `checkpoints/sam2.1_hiera_base_plus.pt`
- If missing, download it (script handles this)

### Slow processing
- Normal on CPU - Florence-2 takes 30-60 seconds per image
- First run downloads models (2-5 minutes)
- Subsequent runs are faster (models cached)

### Videos show no detections
- For **video**, the pipeline uses **one-shot Gemini video detection** when `USE_GEMINI_VIDEO_DETECTION` is true and `GEMINI_API_KEY` is set. If the Gemini video call fails (e.g. quota, format, or size), there is **no per-frame fallback**—so you get zero detections. Fix: set `GEMINI_API_KEY`, or try a short/small video (e.g. &lt;20MB), or set `USE_GEMINI_VIDEO_DETECTION=false` in config to use per-frame detection (slower).

### venv segfault (exit 139) on import
- If `import cv2` or the pipeline crashes with exit code 139 inside the venv, the venv’s native stack (e.g. OpenCV/PyTorch) may be incompatible with your Mac. Try: use Docker to run the pipeline, or recreate the venv with a matching Python/architecture, or run with system Python if dependencies are installed there.

## Quick Start

```bash
cd /Users/leo/FoodProject/food-detection/FoodAI/nutrition-video-analysis/terraform/docker
bash install_local.sh
source venv/bin/activate
python3 run_pipeline.py /Users/leo/FoodProject/food-detection/image.png
```


