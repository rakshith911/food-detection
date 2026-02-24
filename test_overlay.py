"""
Quick local test of the label-on-food overlay logic from pipeline.py.

Simulates approximate bounding-box masks for the food items visible in the test
image and runs the same drawing code that _save_segmentation_masks uses.

Output: test_overlay_result.png  (saved next to this script)
"""

import cv2
import numpy as np
from pathlib import Path

# ---------- colour palette (same as pipeline.py) ----------
DISTINCT_COLORS_RGB = [
    (230,  25,  75),   # Red
    ( 60, 180,  75),   # Green
    (  0, 130, 200),   # Blue
    (255, 225,  25),   # Yellow
    (245, 130,  48),   # Orange
    (145,  30, 180),   # Purple
    ( 70, 240, 240),   # Cyan
    (240,  50, 230),   # Magenta
    (210, 245,  60),   # Lime
    (250, 190, 212),   # Pink
    (  0, 128, 128),   # Teal
    (220, 190, 255),   # Lavender
    (170, 110,  40),   # Brown
    (255, 250, 200),   # Beige
    (128,   0,   0),   # Maroon
    (170, 255, 195),   # Mint
    (128, 128,   0),   # Olive
    (255, 215, 180),   # Apricot
    (  0,   0, 128),   # Navy
    (128, 128, 128),   # Grey
]

# ---------- load image ----------
img_path = Path(__file__).parent / (
    "unhealthy-fast-food-delivery-menu-featuring-assorted-burgers-"
    "cheeseburgers-nuggets-french-fries-soda-high-calorie-low-"
    "356045884.jpg-2.jpg"
)
frame = cv2.imread(str(img_path))
if frame is None:
    raise FileNotFoundError(f"Could not load image: {img_path}")

h, w = frame.shape[:2]
print(f"Image loaded: {w}x{h}")

# ---------- simulate detected food items (approximate bounding boxes) ----------
# Each entry: (obj_id, label, (x1, y1, x2, y2))  – pixel coords
# These are rough rectangles around the visible food items in the test image.
food_items = [
    (1, "Cheeseburger",          (int(w*0.30), int(h*0.35), int(w*0.58), int(h*0.85))),   # centre burger
    (2, "Burger with lettuce",   (int(w*0.00), int(h*0.20), int(w*0.25), int(h*0.65))),   # left burger
    (3, "Burger with onion",     (int(w*0.58), int(h*0.18), int(w*0.82), int(h*0.60))),   # right burger
    (4, "French Fries (front)",  (int(w*0.12), int(h*0.55), int(w*0.35), int(h*0.90))),   # fries front-left
    (5, "French Fries (box)",    (int(w*0.25), int(h*0.05), int(w*0.42), int(h*0.42))),   # fries in box
    (6, "Chicken Nuggets",       (int(w*0.78), int(h*0.65), int(w*0.95), int(h*0.85))),   # nuggets right
    (7, "Cola (left)",           (int(w*0.35), int(h*0.00), int(w*0.52), int(h*0.35))),   # soda left
    (8, "Cola (right)",          (int(w*0.52), int(h*0.00), int(w*0.68), int(h*0.35))),   # soda right
]

# Build masks_dict and tracked_objects (same structure as pipeline)
masks_dict = {}
tracked_objects = {}
for obj_id, label, (x1, y1, x2, y2) in food_items:
    # Create a simple rectangular mask (in real pipeline SAM2 gives precise contours)
    mask = np.zeros((h, w), dtype=np.uint8)
    mask[y1:y2, x1:x2] = 1
    masks_dict[obj_id] = mask
    tracked_objects[obj_id] = {'label': label}

# ---------- run the same overlay logic from _save_segmentation_masks ----------
overlay = frame.astype(np.float32) / 255.0  # BGR float

obj_ids_sorted = sorted(masks_dict.keys())
color_bgr_map = {}
for idx, obj_id in enumerate(obj_ids_sorted):
    r, g, b = DISTINCT_COLORS_RGB[idx % len(DISTINCT_COLORS_RGB)]
    color_bgr_map[obj_id] = (b, g, r)  # OpenCV uses BGR

for obj_id in obj_ids_sorted:
    mask_2d = masks_dict[obj_id]
    label = tracked_objects[obj_id]['label']

    mask_bool = mask_2d.astype(bool)

    # Alpha-blend the colour onto the mask region (50 % opacity)
    bgr = color_bgr_map[obj_id]
    color_f = np.array([bgr[0] / 255.0, bgr[1] / 255.0, bgr[2] / 255.0])
    for c in range(3):
        overlay[:, :, c] = np.where(
            mask_bool,
            overlay[:, :, c] * 0.5 + color_f[c] * 0.5,
            overlay[:, :, c],
        )

    # Find mask centroid to place the label
    ys, xs = np.where(mask_bool)
    if len(xs) > 0:
        cx, cy = int(np.mean(xs)), int(np.mean(ys))
    else:
        cx, cy = w // 2, h // 2

    # Draw label text with a dark background rectangle for readability
    display_label = label[:40]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.55
    thickness = 2
    (tw, th_text), baseline = cv2.getTextSize(display_label, font, font_scale, thickness)

    # Clamp so the label stays within the image bounds
    tx = max(0, min(cx - tw // 2, w - tw - 4))
    ty = max(th_text + 4, min(cy, h - baseline - 4))

    overlay_uint8 = (np.clip(overlay, 0, 1) * 255).astype(np.uint8)

    # Dark background pill behind the text
    cv2.rectangle(
        overlay_uint8,
        (tx - 2, ty - th_text - 2),
        (tx + tw + 2, ty + baseline + 2),
        (0, 0, 0),
        cv2.FILLED,
    )
    # Label text in the object's colour so it matches the mask
    cv2.putText(
        overlay_uint8, display_label, (tx, ty),
        font, font_scale, bgr, thickness, cv2.LINE_AA,
    )

    overlay = overlay_uint8.astype(np.float32) / 255.0

# Final image
result = (np.clip(overlay, 0, 1) * 255).astype(np.uint8)

out_path = Path(__file__).parent / "test_overlay_result.png"
cv2.imwrite(str(out_path), result)
print(f"✓ Overlay saved to: {out_path}")
