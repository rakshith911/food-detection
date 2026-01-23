"""
Main Video Processing Pipeline
Orchestrates Florence-2, SAM2, Metric3D, and RAG for nutrition analysis
"""
import cv2
import torch
import numpy as np
from pathlib import Path
from PIL import Image
from typing import Dict, List, Tuple, Optional
import logging
import json
import sys
import re
from datetime import datetime
import os
import boto3

logger = logging.getLogger(__name__)

# Initialize S3 client for uploading segmented images
s3_client = None
S3_RESULTS_BUCKET = os.environ.get('S3_RESULTS_BUCKET')


class NutritionVideoPipeline:
    """
    Complete pipeline for video-based nutrition analysis
    """
    
    def __init__(self, model_manager, config):
            """
            Initialize pipeline with models and configuration
            
            Args:
                model_manager: ModelManager instance with loaded models
                config: Settings instance with configuration
            """
            self.models = model_manager
            self.config = config
            self.device = config.DEVICE
            
            # Task prompts for Florence-2
            self.TASK_PROMPTS = {
                "caption": "<CAPTION>",
                "detailed_caption": "<DETAILED_CAPTION>",
                "more_detailed_caption": "<MORE_DETAILED_CAPTION>",
                "object_detection": "<OD>",  # Direct object detection
                "hybrid_detection": "hybrid",  # Combines OD + detailed caption
                "detailed_od": "detailed_od",  # OD + basic caption for enhanced labels without hallucinations
                "vqa": "<VQA>"  # Visual Question Answering - format: <VQA> + question
            }
            
            # Calibration state
            self.calibration = {
                'pixels_per_cm': None,
                'calibrated': False,
                'reference_plane_depth_m': None  # Depth of plate/reference surface
            }
            
            # Store Florence-2 detection results for debugging
            self.florence_detections = []
    
    def process_image(self, image_path: Path, job_id: str) -> Dict:
        """
        Process a single image (same pipeline as video, but with 1 frame)

        Args:
            image_path: Path to input image
            job_id: Unique job identifier

        Returns:
            Complete results dictionary with tracking, volumes, and nutrition
        """
        logger.info(f"[{job_id}] Starting image processing: {image_path.name}")

        try:
            # Load image as a single frame
            img = cv2.imread(str(image_path))
            if img is None:
                raise ValueError(f"Could not load image: {image_path}")

            # Resize if needed
            if self.config.RESIZE_WIDTH:
                h, w = img.shape[:2]
                if w > self.config.RESIZE_WIDTH:
                    new_h = int(h * self.config.RESIZE_WIDTH / w)
                    img = cv2.resize(img, (self.config.RESIZE_WIDTH, new_h))
            
            # Convert BGR to RGB (cv2 loads as BGR, but PIL/Florence-2 expect RGB)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            frames = [img]
            logger.info(f"[{job_id}] Loaded image as single frame")

            # Step 2: Run tracking pipeline with depth
            tracking_results = self._run_tracking_pipeline(frames, job_id)

            # Step 3: Analyze nutrition
            print("🍎 Analyzing nutrition...")
            import sys
            sys.stdout.flush()
            nutrition_results = self._analyze_nutrition(tracking_results, job_id)
            print("✓ Nutrition analysis complete")
            sys.stdout.flush()

            # Step 4: Compile complete results
            final_results = {
                'job_id': job_id,
                'media_name': image_path.name,
                'media_type': 'image',
                'timestamp': datetime.utcnow().isoformat(),
                'num_frames_processed': 1,
                'calibration': self.calibration,
                'florence_detections': self.florence_detections,  # Store Florence-2 detection results
                'tracking': tracking_results,
                'nutrition': nutrition_results,
                'status': 'completed'
            }

            logger.info(f"[{job_id}] ✓ Image processing completed successfully")
            return final_results

        except Exception as e:
            logger.error(f"[{job_id}] Image processing failed: {e}", exc_info=True)
            raise

    def process_video(self, video_path: Path, job_id: str) -> Dict:
        """
        Main entry point - process entire video

        Args:
            video_path: Path to input video
            job_id: Unique job identifier

        Returns:
            Complete results dictionary with tracking, volumes, and nutrition
        """
        logger.info(f"[{job_id}] Starting video processing: {video_path.name}")

        try:
            # Step 1: Load and prepare frames
            frames = self._load_frames(video_path)
            if not frames:
                raise ValueError("No frames loaded from video")

            logger.info(f"[{job_id}] Loaded {len(frames)} frames")

            # Step 2: Run tracking pipeline with depth
            tracking_results = self._run_tracking_pipeline(frames, job_id)

            # Step 3: Analyze nutrition
            nutrition_results = self._analyze_nutrition(tracking_results, job_id)

            # Step 4: Compile complete results
            final_results = {
                    'job_id': job_id,
                    'media_name': video_path.name,
                    'media_type': 'video',
                    'timestamp': datetime.utcnow().isoformat(),
                    'num_frames_processed': len(frames),
                    'calibration': self.calibration,
                    'florence_detections': self.florence_detections,  # Store Florence-2 detection results
                    'tracking': tracking_results,
                    'nutrition': nutrition_results,
                    'status': 'completed'
                }

            logger.info(f"[{job_id}] ✓ Processing completed successfully")
            return final_results

        except Exception as e:
            logger.error(f"[{job_id}] Pipeline failed: {e}", exc_info=True)
            raise
    
    def _load_frames(self, video_path: Path) -> List[np.ndarray]:
        """Load and subsample frames from video"""
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"Video: {fps:.1f}fps, {total_frames} total frames")
        logger.info(f"Processing every {self.config.FRAME_SKIP} frames")
        
        frames = []
        frame_idx = 0
        frames_loaded = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_idx % self.config.FRAME_SKIP == 0:
                # Resize frame
                aspect_ratio = frame.shape[0] / frame.shape[1]
                new_height = int(self.config.RESIZE_WIDTH * aspect_ratio)
                frame_resized = cv2.resize(frame, (self.config.RESIZE_WIDTH, new_height))
                frames.append(cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB))
                frames_loaded += 1
                
                # Check max_frames limit
                if self.config.MAX_FRAMES and frames_loaded >= self.config.MAX_FRAMES:
                    break
            
            frame_idx += 1
        
        cap.release()
        return frames
    
    def _run_tracking_pipeline(self, frames: List[np.ndarray], job_id: str) -> Dict:
        """
        Run complete tracking pipeline with depth estimation
        
        Returns:
            Dict with tracked objects and volume measurements
        """
        logger.info(f"[{job_id}] Running tracking pipeline...")
        
        # Get models
        florence_processor, florence_model = self.models.florence2
        video_predictor = self.models.sam2
        metric3d_model = self.models.metric3d
        
        # Prepare frame directory for SAM2
        frame_dir = self.config.OUTPUT_DIR / job_id / "frames_temp"
        frame_dir.mkdir(parents=True, exist_ok=True)
        
        # Save frames
        for idx, frame in enumerate(frames):
            frame_path = frame_dir / f"{idx:05d}.jpg"
            Image.fromarray(frame).save(frame_path)
        
        # Initialize SAM2 inference state
        print("📦 Initializing SAM2 inference state...")
        import sys
        sys.stdout.flush()
        try:
            inference_state = video_predictor.init_state(video_path=str(frame_dir))
            print("✓ SAM2 state initialized")
            sys.stdout.flush()
        except Exception as e:
            print(f"❌ SAM2 init failed: {e}")
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            raise
        
        # Tracking state
        tracked_objects = {}
        next_object_id = 1
        colors = {}
        volume_history = {}
        video_segments = {}  # Store SAM2 masks for all frames
        sam2_to_obj_id = {}  # Map SAM2's internal IDs to our persistent obj_ids
        current_window_start = 0
        caption = None  # Store the caption from Florence-2
        
        # Process frames
        print(f"\n📹 Processing {len(frames)} frame(s)...")
        sys.stdout.flush()
        
        try:
            for frame_idx, frame in enumerate(frames):
                logger.debug(f"[{job_id}] Processing frame {frame_idx+1}/{len(frames)}")
                print(f"\n🖼️  Frame {frame_idx+1}/{len(frames)}")
                sys.stdout.flush()
                
                frame_pil = Image.fromarray(frame)
                
                # Periodic re-detection
                if frame_idx % self.config.DETECTION_INTERVAL == 0:
                    logger.info(f"[{job_id}] Frame {frame_idx}: Re-detecting objects...")
                    print(f"🔍 Detecting objects in frame {frame_idx}... (this may take 30-60 seconds on CPU)")
                    sys.stdout.flush()
                    
                    try:
                        # Detect objects
                        boxes, labels, detected_caption, unquantified_ingredients = self._detect_objects_florence(
                            frame_pil, florence_processor, florence_model
                        )
                        # Store caption for results (use the latest caption if multiple detections)
                        if detected_caption:
                            caption = detected_caption
                        print(f"✓ Detection complete: found {len(boxes)} objects")
                        sys.stdout.flush()
                    except Exception as e:
                        print(f"❌ Detection failed: {e}")
                        import traceback
                        traceback.print_exc()
                        sys.stdout.flush()
                        raise
                    
                    logger.info(f"[{job_id}] Frame {frame_idx}: Florence-2 detected {len(boxes)} objects: {labels}")
                    
                    # Use Gemini to filter out non-food items
                    if self.config.GEMINI_API_KEY and len(labels) > 0:
                        filtered_boxes, filtered_labels = self._filter_non_food_with_gemini(boxes, labels, job_id, frame_idx)
                        boxes = np.array(filtered_boxes) if filtered_boxes else np.array([])
                        labels = filtered_labels
                        logger.info(f"[{job_id}] Frame {frame_idx}: After Gemini filtering: {len(boxes)} food items: {labels}")
                    
                    # Store Florence-2 detection results for debugging
                    detection_info = {
                        'frame_idx': frame_idx,
                        'caption': caption,
                        'detections': [
                            {
                                'label': label,
                                'box': box.tolist() if hasattr(box, 'tolist') else list(box),
                                'box_area': float((box[2] - box[0]) * (box[3] - box[1]))
                            }
                            for box, label in zip(boxes, labels)
                        ],
                        'total_detected': len(boxes),
                        'unquantified_ingredients': unquantified_ingredients  # Ingredients detected but not localized
                    }
                    self.florence_detections.append(detection_info)
                    
                    if len(boxes) > 0:
                        # Match new detections to existing objects using spatial overlap (IoU)
                        # High IoU = same object, Low IoU = new object
                        # Use greedy 1-to-1 matching: each object matches to at most one detection
                        matched_mapping = {}  # Maps existing_obj_id -> new_detection_idx
                        matched_new_indices = set()  # Track which new detections are already matched
                        unmatched_new = list(range(len(boxes)))  # Indices of new detections not matched
                        
                        if tracked_objects:
                            # Calculate IoU matrix
                            iou_matrix = []
                            for obj_id, obj_data in tracked_objects.items():
                                if 'box' in obj_data:
                                    row = []
                                    for new_box in boxes:
                                        iou = self._calculate_iou(new_box, obj_data['box'])
                                        row.append(iou)
                                    iou_matrix.append((obj_id, row))
                            
                            # Greedy matching: match highest IoU pairs first
                            while iou_matrix:
                                # Find the highest IoU across all (object, detection) pairs
                                best_iou = 0.0
                                best_obj_id = None
                                best_new_idx = None
                                
                                for obj_id, iou_row in iou_matrix:
                                    for new_idx, iou in enumerate(iou_row):
                                        if new_idx not in matched_new_indices and iou > best_iou:
                                            best_iou = iou
                                            best_obj_id = obj_id
                                            best_new_idx = new_idx
                                
                                # If best IoU > 0.5, match them
                                if best_iou > 0.5 and best_obj_id is not None:
                                    matched_mapping[best_obj_id] = best_new_idx
                                    matched_new_indices.add(best_new_idx)
                                    if best_new_idx in unmatched_new:
                                        unmatched_new.remove(best_new_idx)
                                    logger.info(f"[{job_id}] Frame {frame_idx}: Matched '{labels[best_new_idx]}' to existing ID{best_obj_id} ('{tracked_objects[best_obj_id]['label']}') with IoU={best_iou:.2f}")
                                    
                                    # Remove matched object from matrix
                                    iou_matrix = [(oid, row) for oid, row in iou_matrix if oid != best_obj_id]
                                else:
                                    break  # No more good matches
                        
                        logger.info(f"[{job_id}] Frame {frame_idx}: Matched {len(matched_mapping)} objects, {len(unmatched_new)} new objects")
                        
                        # Reset SAM2 state
                        inference_state = video_predictor.init_state(video_path=str(frame_dir))
                        video_segments = {}  # Reset video segments when SAM2 resets
                        sam2_to_obj_id = {}  # Reset SAM2 ID mapping
                        current_window_start = frame_idx
                        
                        # Update tracked objects
                        boxes_to_add = []
                        ids_to_add = []
                        
                        # Matched objects (update label to latest detection, keep same ID)
                        for old_id, new_idx in matched_mapping.items():
                            old_label = tracked_objects[old_id]['label']
                            new_label = labels[new_idx]
                            if old_label != new_label:
                                logger.info(f"[{job_id}] Frame {frame_idx}: Updating label for ID{old_id}: '{old_label}' → '{new_label}'")
                            tracked_objects[old_id]['box'] = boxes[new_idx]
                            tracked_objects[old_id]['label'] = new_label
                            tracked_objects[old_id]['last_seen_frame'] = frame_idx
                            boxes_to_add.append(boxes[new_idx])
                            ids_to_add.append(old_id)
                        
                        # New objects (no spatial overlap with existing - these are NEW food items)
                        for new_idx in unmatched_new:
                            obj_id = next_object_id
                            next_object_id += 1
                            
                            color = np.random.randint(0, 255, size=3, dtype=np.uint8)
                            colors[obj_id] = color
                            
                            tracked_objects[obj_id] = {
                                'box': boxes[new_idx],
                                'label': labels[new_idx],
                                'color': color,
                                'first_seen_frame': frame_idx,
                                'last_seen_frame': frame_idx
                            }
                            
                            boxes_to_add.append(boxes[new_idx])
                            ids_to_add.append(obj_id)
                            logger.info(f"[{job_id}] Frame {frame_idx}: Added NEW object ID{obj_id} ('{labels[new_idx]}') - no spatial overlap with existing objects")
                        
                        # Add objects to SAM2 with sequential SAM2 IDs (1, 2, 3...)
                        successfully_added = []
                        sam2_id = 1  # SAM2 uses sequential IDs starting from 1
                        for i, obj_id in enumerate(ids_to_add):
                            box = boxes_to_add[i]
                            label = tracked_objects[obj_id]['label']
                            
                            # Validate box coordinates
                            x1, y1, x2, y2 = box
                            if x2 <= x1 or y2 <= y1:
                                logger.error(f"[{job_id}] Frame {frame_idx}: Invalid box for object ID{obj_id} ({label}): {box}")
                                continue
                            
                            # Ensure box is within frame bounds
                            h, w = frame.shape[:2]
                            x1 = max(0, min(x1, w-1))
                            y1 = max(0, min(y1, h-1))
                            x2 = max(x1+1, min(x2, w))
                            y2 = max(y1+1, min(y2, h))
                            # SAM2 expects box in format [[x1, y1], [x2, y2]] not [x1, y1, x2, y2]
                            box_sam = np.array([[[x1, y1], [x2, y2]]])
                            
                            logger.info(f"[{job_id}] Frame {frame_idx}: Adding object ID{obj_id} ({label}) to SAM2 as SAM2_ID{sam2_id} with box: {box_sam[0]}")
                            try:
                                video_predictor.add_new_points_or_box(
                                    inference_state=inference_state,
                                    frame_idx=frame_idx - current_window_start,
                                    obj_id=sam2_id,  # Use SAM2's sequential ID
                                    box=box_sam,
                                )
                                sam2_to_obj_id[sam2_id] = obj_id  # Map SAM2 ID to our persistent ID
                                successfully_added.append(obj_id)
                                logger.info(f"[{job_id}] Frame {frame_idx}: ✅ Successfully added object ID{obj_id} ({label}) to SAM2")
                                sam2_id += 1
                            except Exception as e:
                                logger.error(f"[{job_id}] Frame {frame_idx}: ❌ FAILED to add object ID{obj_id} ({label}) to SAM2: {e}", exc_info=True)
                        logger.info(f"[{job_id}] Frame {frame_idx}: Added {len(successfully_added)}/{len(ids_to_add)} objects to SAM2. Successfully added IDs: {successfully_added}")
                        
                        # Get masks for the current detection frame only (optimization)
                        relative_idx = 0  # Detection happens at start of window
                        logger.info(f"[{job_id}] Frame {frame_idx}: Getting SAM2 masks for detection frame...")
                        try:
                            out_frame_idx, sam2_obj_ids, out_mask_logits = video_predictor.infer_single_frame(
                                inference_state, relative_idx
                            )
                            # Map SAM2's IDs back to our persistent obj_ids
                            video_segments[relative_idx] = {}
                            for i, sam2_id in enumerate(sam2_obj_ids):
                                if sam2_id in sam2_to_obj_id:
                                    obj_id = sam2_to_obj_id[sam2_id]
                                    video_segments[relative_idx][obj_id] = (out_mask_logits[i] > 0.0).cpu().numpy()
                                else:
                                    logger.warning(f"[{job_id}] Frame {frame_idx}: SAM2 returned ID{sam2_id} not in mapping!")
                            logger.info(f"[{job_id}] Frame {frame_idx}: Got masks for {len(video_segments[relative_idx])} objects (obj_ids: {list(video_segments[relative_idx].keys())})")
                        except Exception as e:
                            logger.error(f"[{job_id}] Frame {frame_idx}: SAM2 inference failed: {e}")
                        
                        # Calibration (if not already calibrated)
                        if not self.calibration['calibrated']:
                            logger.info(f"[{job_id}] Frame {frame_idx}: Performing calibration...")
                            depth_map_meters = self._estimate_depth_metric3d(frame, metric3d_model)
                            self.calibration['pixels_per_cm'] = self.config.DEFAULT_PIXELS_PER_CM
                            scene_depths = depth_map_meters[depth_map_meters > 0]
                            if len(scene_depths) > 0:
                                self.calibration['reference_plane_depth_m'] = np.median(scene_depths)
                            else:
                                self.calibration['reference_plane_depth_m'] = self.config.DEFAULT_REFERENCE_PLANE_DEPTH_M
                            self.calibration['calibrated'] = True
                            logger.info(f"[{job_id}] Calibration: {self.calibration['pixels_per_cm']:.2f} px/cm, reference plane at {self.calibration['reference_plane_depth_m']:.3f}m")
                        else:
                            # Already calibrated, get depth for this frame
                            depth_map_meters = self._estimate_depth_metric3d(frame, metric3d_model)
                        
                        # Calculate volumes for objects in the detection frame
                        if relative_idx in video_segments:
                            for obj_id in video_segments[relative_idx]:
                                if obj_id in tracked_objects:
                                    mask = video_segments[relative_idx][obj_id][0]
                                    box = tracked_objects[obj_id]['box']
                                    label = tracked_objects[obj_id]['label']
                                    
                                    volume_metrics = self._calculate_volume_metric3d(mask, depth_map_meters, box, label)
                                    
                                    if obj_id not in volume_history:
                                        volume_history[obj_id] = []
                                    volume_history[obj_id].append({
                                        'frame': frame_idx,
                                        'volume_ml': volume_metrics['volume_ml'],
                                        'height_cm': volume_metrics['avg_height_cm'],
                                        'area_cm2': volume_metrics['surface_area_cm2']
                                    })
                                    logger.info(f"[{job_id}] Frame {frame_idx}: ID{obj_id} ({label}) volume={volume_metrics['volume_ml']:.1f}ml")
            
            # No additional processing needed - volumes calculated at each detection frame
            
            print(f"✓ Frame {frame_idx} processing complete")
            sys.stdout.flush()
        
        except Exception as e:
            print(f"❌ Frame processing failed: {e}")
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            raise
        
        # Final deduplication: merge tracked objects that are duplicates
        tracked_objects = self._deduplicate_tracked_objects(tracked_objects, volume_history)
        
        # Compile results
        print("📊 Compiling results...")
        sys.stdout.flush()
        results = {
            'objects': {},
            'total_objects': len(tracked_objects),
            'caption': caption  # Include the Florence-2 caption
        }
        
        # Compile results for ALL objects that have volume history (not just current tracked_objects)
        # This ensures we don't lose objects from previous SAM2 windows
        objects_with_volume = set()
        for obj_id in volume_history.keys():
            history = volume_history[obj_id]
            if len(history) > 0:
                # Get label from tracked_objects, or from history if not in current tracking
                if obj_id in tracked_objects:
                    label = tracked_objects[obj_id]['label']
                else:
                    # Object from previous window - need to retrieve label
                    # For now, mark as "Unknown" but this should be fixed by accumulation
                    label = f"Unknown_{obj_id}"
                    logger.warning(f"[{job_id}] Object ID{obj_id} has volume history but is not in tracked_objects")
                
                volumes = [h['volume_ml'] for h in history]
                heights = [h['height_cm'] for h in history]
                areas = [h['area_cm2'] for h in history]
                
                results['objects'][f"ID{obj_id}_{label}"] = {
                    'label': label,
                    'statistics': {
                        'max_volume_ml': float(max(volumes)),
                        'median_volume_ml': float(np.median(volumes)),
                        'mean_volume_ml': float(np.mean(volumes)),
                        'max_height_cm': float(max(heights)),
                        'max_area_cm2': float(max(areas)),
                        'num_frames': len(history)
                    }
                }
                objects_with_volume.add(obj_id)
        
        # Include ALL tracked objects, even if they don't have volume calculations
        # This ensures items detected but without SAM2 masks/volumes are still included
        for obj_id, obj_data in tracked_objects.items():
            if obj_id not in objects_with_volume:
                label = obj_data['label']
                box = obj_data['box']
                box_area = (box[2] - box[0]) * (box[3] - box[1])
                
                # Estimate volume from bounding box area (rough approximation)
                # Assume average height of 2cm for items without depth data
                estimated_height_cm = 2.0
                estimated_volume_ml = (box_area / (self.calibration['pixels_per_cm'] ** 2)) * estimated_height_cm
                
                logger.warning(f"[{job_id}] Object ID{obj_id} ('{label}') detected but no volume calculated - using estimated volume {estimated_volume_ml:.1f}ml")
                
                results['objects'][f"ID{obj_id}_{label}"] = {
                    'label': label,
                    'statistics': {
                        'max_volume_ml': float(estimated_volume_ml),
                        'median_volume_ml': float(estimated_volume_ml),
                        'mean_volume_ml': float(estimated_volume_ml),
                        'max_height_cm': float(estimated_height_cm),
                        'max_area_cm2': float(box_area / (self.calibration['pixels_per_cm'] ** 2)),
                        'num_frames': 1,
                        'estimated': True  # Flag to indicate this is an estimate
                    }
                }
        
        logger.info(f"[{job_id}] Tracked {len(results['objects'])} objects across all frames ({len(objects_with_volume)} with calculated volumes, {len(results['objects']) - len(objects_with_volume)} with estimated volumes)")
        results['total_objects'] = len(results['objects'])
        return results
    
    def _deduplicate_tracked_objects(self, tracked_objects, volume_history):
        """Remove duplicate tracked objects with same label and overlapping boxes"""
        if len(tracked_objects) <= 1:
            return tracked_objects
        
        # Normalize labels
        def normalize_label(label):
            label_lower = label.lower().strip()
            for article in ['a ', 'an ', 'the ']:
                if label_lower.startswith(article):
                    label_lower = label_lower[len(article):].strip()
            if label_lower.endswith('s') and label_lower not in ['glass', 'glasses', 'fries', 'nuggets']:
                label_lower = label_lower[:-1]
            return label_lower
        
        # Convert to list for easier processing
        obj_list = [(obj_id, obj_data) for obj_id, obj_data in tracked_objects.items()]
        keep = [True] * len(obj_list)
        
        # Check each pair for duplicates
        for i in range(len(obj_list)):
            if not keep[i]:
                continue
            
            obj_id_i, obj_data_i = obj_list[i]
            box_i = obj_data_i['box']
            label_i_norm = normalize_label(obj_data_i['label'])
            area_i = (box_i[2] - box_i[0]) * (box_i[3] - box_i[1])
            
            for j in range(i + 1, len(obj_list)):
                if not keep[j]:
                    continue
                
                obj_id_j, obj_data_j = obj_list[j]
                box_j = obj_data_j['box']
                label_j_norm = normalize_label(obj_data_j['label'])
                
                # Only check duplicates if labels match
                if label_i_norm != label_j_norm:
                    continue
                
                # Check IoU and center distance
                iou = self._calculate_iou(box_i, box_j)
                center_i = np.array([(box_i[0] + box_i[2]) / 2, (box_i[1] + box_i[3]) / 2])
                center_j = np.array([(box_j[0] + box_j[2]) / 2, (box_j[1] + box_j[3]) / 2])
                center_dist = np.linalg.norm(center_i - center_j)
                avg_size = np.mean([box_i[2] - box_i[0], box_i[3] - box_i[1], box_j[2] - box_j[0], box_j[3] - box_j[1]])
                
                # If overlapping or very close, remove duplicate (keep larger one)
                if iou > 0.2 or center_dist < avg_size * 0.5:
                    area_j = (box_j[2] - box_j[0]) * (box_j[3] - box_j[1])
                    if area_i >= area_j:
                        # Keep i, remove j
                        keep[j] = False
                        # Merge volume history from j into i
                        if obj_id_j in volume_history and obj_id_i in volume_history:
                            volume_history[obj_id_i].extend(volume_history[obj_id_j])
                            logger.info(f"Merged volume history from ID{obj_id_j} into ID{obj_id_i} (duplicate '{obj_data_j['label']}')")
                    else:
                        # Keep j, remove i
                        keep[i] = False
                        # Merge volume history from i into j
                        if obj_id_i in volume_history and obj_id_j in volume_history:
                            volume_history[obj_id_j].extend(volume_history[obj_id_i])
                            logger.info(f"Merged volume history from ID{obj_id_i} into ID{obj_id_j} (duplicate '{obj_data_i['label']}')")
                        break
        
        # Build result dict and clean up volume_history for removed objects
        result = {}
        removed_ids = []
        for i, (obj_id, obj_data) in enumerate(obj_list):
            if keep[i]:
                result[obj_id] = obj_data
            else:
                removed_ids.append(obj_id)
        
        # Remove volume history for objects that were deduplicated
        for obj_id in removed_ids:
            if obj_id in volume_history:
                del volume_history[obj_id]
                logger.debug(f"Removed volume history for deduplicated object ID{obj_id}")
        
        return result
    
    def _detect_objects_florence(self, image_pil, processor, model):
        """Detect objects using Florence-2"""
        import sys
        sys.stdout.flush()
        
        # Track ingredients that VQA identifies but grounding can't localize
        unquantified_ingredients = []
        
        # Check if using hybrid detection (combines OD + detailed caption)
        if self.config.caption_type == "hybrid_detection":
            print("  → Using hybrid detection (OD + detailed caption)...")
            sys.stdout.flush()
            
            # Method 1: Direct object detection
            print("    → Step 1: Direct object detection (OD)...")
            sys.stdout.flush()
            od_results = self._run_florence2("<OD>", None, image_pil, processor, model)
            od_data = od_results.get("<OD>", {})
            od_boxes = np.array(od_data.get("bboxes", []))
            od_labels = od_data.get("labels", [])
            print(f"    ✓ OD found {len(od_boxes)} objects")
            sys.stdout.flush()
            
            # Method 2: Detailed caption + grounding
            print("    → Step 2: Detailed caption + phrase grounding...")
            sys.stdout.flush()
            caption_results = self._run_florence2("<MORE_DETAILED_CAPTION>", None, image_pil, processor, model)
            caption = caption_results["<MORE_DETAILED_CAPTION>"]
            print(f"    ✓ Caption: {caption[:100]}...")
            sys.stdout.flush()
            
            grounding_results = self._run_florence2('<CAPTION_TO_PHRASE_GROUNDING>', caption, image_pil, processor, model)
            grounding_data = grounding_results['<CAPTION_TO_PHRASE_GROUNDING>']
            caption_boxes = np.array(grounding_data.get("bboxes", []))
            caption_labels = grounding_data.get("labels", [])
            print(f"    ✓ Caption grounding found {len(caption_boxes)} objects")
            sys.stdout.flush()
            
            # Merge results: Use OD detections as primary source (most accurate, no hallucinations)
            # Only add caption detections for objects that OD didn't detect
            print("    → Merging detection results (OD-first approach)...")
            sys.stdout.flush()
            all_boxes = []
            all_labels = []
            
            # Add all OD detections first (these are grounded and accurate)
            for od_box, od_label in zip(od_boxes, od_labels):
                all_boxes.append(od_box)
                all_labels.append(od_label)
            
            # Only add caption detections that don't overlap with OD detections
            # This avoids hallucinations from caption generation
            for cap_box, cap_label in zip(caption_boxes, caption_labels):
                # Check if this caption detection overlaps significantly with any OD detection
                overlaps_with_od = False
                for od_box in od_boxes:
                    iou = self._calculate_iou(cap_box, od_box)
                    if iou > 0.3:  # If >30% overlap, OD already detected it - skip caption (avoids hallucinations)
                        overlaps_with_od = True
                        break
                
                if not overlaps_with_od:
                    # Only add if OD didn't detect this object
                    all_boxes.append(cap_box)
                    all_labels.append(cap_label)
            
            # Deduplicate: remove overlapping detections with similar labels
            boxes, labels = self._deduplicate_detections(all_boxes, all_labels)
            
            # Store full caption (don't truncate)
            caption = f"Hybrid detection: {caption}"
            print(f"  ✓ Hybrid detection complete: {len(boxes)} total objects (OD: {len(od_boxes)}, Caption: {len(caption_boxes)}, After dedup: {len(boxes)})")
            sys.stdout.flush()
            
        elif self.config.caption_type == "detailed_od":
            # Detailed OD: Use OD for accuracy, enhance with basic caption for more specific labels
            print("  → Using detailed OD (OD + basic caption for enhanced labels)...")
            sys.stdout.flush()
            
            # Step 1: Direct object detection (accurate, no hallucinations)
            print("    → Step 1: Direct object detection (OD)...")
            sys.stdout.flush()
            od_results = self._run_florence2("<OD>", None, image_pil, processor, model)
            od_data = od_results.get("<OD>", {})
            od_boxes = np.array(od_data.get("bboxes", []))
            od_labels = od_data.get("labels", [])
            print(f"    ✓ OD found {len(od_boxes)} objects")
            sys.stdout.flush()
            
            # Step 2: Basic caption (less prone to hallucinations than MORE_DETAILED_CAPTION)
            print("    → Step 2: Basic caption for context...")
            sys.stdout.flush()
            caption_results = self._run_florence2("<DETAILED_CAPTION>", None, image_pil, processor, model)
            caption = caption_results.get("<DETAILED_CAPTION>", "")
            print(f"    ✓ Caption: {caption[:100]}...")
            sys.stdout.flush()
            
            # Step 3: Ground caption phrases to get more specific labels
            print("    → Step 3: Grounding caption phrases...")
            sys.stdout.flush()
            grounding_results = self._run_florence2('<CAPTION_TO_PHRASE_GROUNDING>', caption, image_pil, processor, model)
            grounding_data = grounding_results.get('<CAPTION_TO_PHRASE_GROUNDING>', {})
            caption_boxes = np.array(grounding_data.get("bboxes", []))
            caption_labels = grounding_data.get("labels", [])
            print(f"    ✓ Caption grounding found {len(caption_boxes)} phrases")
            sys.stdout.flush()
            
            # Step 4: Enhance OD labels with caption labels when they match
            print("    → Step 4: Enhancing OD labels with caption details...")
            sys.stdout.flush()
            enhanced_labels = []
            enhanced_boxes = []
            
            # For each OD detection, try to find a matching caption label that's more specific
            for od_box, od_label in zip(od_boxes, od_labels):
                best_match_label = od_label
                best_iou = 0
                
                # Find caption label that overlaps with this OD box and is more specific
                for cap_box, cap_label in zip(caption_boxes, caption_labels):
                    iou = self._calculate_iou(od_box, cap_box)
                    if iou > 0.3 and iou > best_iou:
                        # Check if caption label is more specific (longer, more descriptive)
                        # But avoid if it contains color adjectives (hallucination risk)
                        cap_label_lower = cap_label.lower()
                        has_color_hallucination = any(color in cap_label_lower.split() for color in 
                                                     ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink'])
                        
                        if not has_color_hallucination and len(cap_label) > len(od_label):
                            best_match_label = cap_label
                            best_iou = iou
                
                enhanced_boxes.append(od_box)
                enhanced_labels.append(best_match_label)
            
            # Add caption detections that don't overlap with OD (new objects)
            for cap_box, cap_label in zip(caption_boxes, caption_labels):
                overlaps_with_od = False
                for od_box in od_boxes:
                    iou = self._calculate_iou(cap_box, od_box)
                    if iou > 0.3:
                        overlaps_with_od = True
                        break
                
                if not overlaps_with_od:
                    # Check for color hallucinations before adding
                    cap_label_lower = cap_label.lower()
                    has_color_hallucination = any(color in cap_label_lower.split() for color in 
                                                 ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink'])
                    if not has_color_hallucination:
                        enhanced_boxes.append(cap_box)
                        enhanced_labels.append(cap_label)
            
            boxes = np.array(enhanced_boxes)
            labels = enhanced_labels
            
            # Deduplicate
            boxes, labels = self._deduplicate_detections(boxes, labels)
            
            caption = f"Detailed OD: {caption}"
            print(f"  ✓ Detailed OD complete: {len(boxes)} objects (enhanced from {len(od_boxes)} OD detections)")
            sys.stdout.flush()
            
        elif self.config.caption_type == "object_detection":
            print("  → Detecting objects directly (OD task)...")
            sys.stdout.flush()
            od_results = self._run_florence2("<OD>", None, image_pil, processor, model)
            od_data = od_results.get("<OD>", {})
            
            boxes = np.array(od_data.get("bboxes", []))
            labels = od_data.get("labels", [])
            caption = f"Detected objects: {', '.join(labels) if len(labels) > 0 else 'none'}"
            print(f"  ✓ Object detection complete: found {len(boxes)} objects")
            sys.stdout.flush()
            
        elif self.config.caption_type == "vqa":
            # VQA mode: Ask food-focused questions to get food items
            # Format: <VQA> + question (task token followed by question)
            print("  → Using VQA (Visual Question Answering) for food detection...")
            sys.stdout.flush()
            
            # Ask food-focused questions
            food_items = []
            for question in self.config.VQA_QUESTIONS:
                print(f"    → Asking: {question}")
                sys.stdout.flush()
                try:
                    # VQA: Use <VQA> task token followed by the question
                    vqa_result = self._run_florence2("<VQA>", question, image_pil, processor, model)
                    
                    # Debug: Log raw result for troubleshooting
                    logger.debug(f"Raw VQA result for question '{question}': {vqa_result}")
                    
                    # Extract answer from VQA result
                    answer = vqa_result.get("<VQA>", "")
                    if isinstance(answer, dict):
                        # If it's a dict, try to get text/answer field
                        answer = answer.get("answer", answer.get("text", str(answer)))
                    elif not isinstance(answer, str):
                        answer = str(answer)
                    
                    # Debug: Log raw answer before cleaning
                    logger.debug(f"Raw answer before cleaning: '{answer}'")
                    print(f"    → Raw answer: {answer[:200]}...")  # Show raw answer for debugging
                    sys.stdout.flush()
                    
                    # Use Gemini to format the answer (already configured for RAG fallback)
                    # Gemini understands semantic meaning, avoiding hardcoded patterns
                    if self.config.GEMINI_API_KEY:
                        try:
                            print(f"    → Formatting with Gemini...")
                            sys.stdout.flush()
                            
                            import google.generativeai as genai
                            import time
                            time.sleep(0.2)  # Rate limiting
                            genai.configure(api_key=self.config.GEMINI_API_KEY)
                            gemini_model = genai.GenerativeModel('models/gemini-2.5-flash')
                            
                            prompt = (
                                f"Extract only the food item names from this text and list them separated by commas. "
                                f"Do not include utensils, plates, tables, or locations. "
                                f"Keep multi-word food names together (e.g., 'chicken nuggets', 'ice tea'). "
                                f"Text: {answer} "
                                f"Answer with just the comma-separated list:"
                            )
                            
                            response = gemini_model.generate_content(prompt)
                            formatted_answer = response.text.strip()
                            print(f"    → Gemini output: {formatted_answer[:100]}...")
                            sys.stdout.flush()
                            answer = formatted_answer
                        except Exception as e:
                            logger.warning(f"Gemini formatting failed: {e}, using simple text normalization")
                            # Fallback to simple normalization
                            answer = re.sub(r'\s+and\s+', ', ', answer, flags=re.IGNORECASE)
                            answer = re.sub(r'\s+on\s+(a\s+)?(wooden|white|blue)\s+(table|plate|board)', '', answer, flags=re.IGNORECASE)
                            print(f"    → Cleaned answer (fallback): {answer[:100]}...")
                            sys.stdout.flush()
                    else:
                        # No Gemini key - use simple text normalization
                        answer = re.sub(r'\s+and\s+', ', ', answer, flags=re.IGNORECASE)
                        answer = re.sub(r'\s+on\s+(a\s+)?(wooden|white|blue)\s+(table|plate|board)', '', answer, flags=re.IGNORECASE)
                        print(f"    → Cleaned answer: {answer[:100]}...")
                        sys.stdout.flush()
                    
                    answer = answer.strip()
                    
                    # Check if answer contains structured/XML-like tags (poly, loc, etc.) - this indicates grounding output, not VQA text
                    # If so, extract only the text portion before any XML tags appear
                    xml_tag_pattern = r'<[^>]+>'
                    if re.search(xml_tag_pattern, answer):
                        # Extract text before first XML tag
                        text_before_xml = re.split(xml_tag_pattern, answer)[0].strip()
                        if text_before_xml and len(text_before_xml) > 5:
                            answer = text_before_xml
                            print(f"    ⚠ Detected structured output, extracted text portion: {answer[:100]}...")
                            sys.stdout.flush()
                        else:
                            # If no meaningful text before XML, skip this answer
                            print(f"    ⚠ Skipping structured output (grounding format, not VQA text): {answer[:100]}...")
                            sys.stdout.flush()
                            continue
                    
                    # Remove task tokens and special tokens
                    answer = answer.replace("<VQA>", "").replace("<|endoftext|>", "").strip()
                    
                    # Check if answer is just repeating the question (common Florence-2 issue)
                    answer_lower = answer.lower()
                    question_lower = question.lower()
                    
                    # If answer has conversational fluff, try to extract the actual food list
                    # Pattern 1: "X? yes, ..." or "X. yes, ..." -> keep just X
                    # Pattern 2: "... are X, Y, Z" -> extract X, Y, Z
                    # Pattern 3: "X, Y, and Z are visible" -> keep X, Y, and Z
                    
                    # Remove conversational confirmations: "yes,", "sure,", etc.
                    answer = re.sub(r'\.\s*(yes|sure|ok|okay|right|correct)[,\s]+.*$', '', answer, flags=re.IGNORECASE)
                    answer = re.sub(r'\?\s*(yes|sure|ok|okay|right|correct)[,\s]+.*$', '', answer, flags=re.IGNORECASE)
                    
                    # Extract content after separators if it looks like a list
                    list_separators = [
                        (r'^.*?\s+are\s+', ''),  # "... are X, Y, Z" -> "X, Y, Z"
                        (r'^.*?\s+is\s+', ''),   # "... is X, Y, Z" -> "X, Y, Z"
                        (r'^.*?:\s*', ''),       # "...: X, Y, Z" -> "X, Y, Z"
                    ]
                    
                    original_answer = answer
                    for pattern, replacement in list_separators:
                        if re.search(pattern, answer, flags=re.IGNORECASE):
                            extracted = re.sub(pattern, replacement, answer, count=1, flags=re.IGNORECASE).strip()
                            # Only use extraction if result has commas or is short (looks like a list)
                            if ',' in extracted or len(extracted.split()) <= 10:
                                answer = extracted
                                break
                    
                    if answer != original_answer:
                        print(f"    → Extracted list from answer: {answer[:80]}...")
                        sys.stdout.flush()
                    
                    # Clean answer in stages for better results
                    
                    # Stage 1: Normalize "and" to commas FIRST (before spatial cleaning)
                    # This prevents "and" from being lost during spatial cleaning
                    answer = re.sub(r'\s+and\s+', ', ', answer, flags=re.IGNORECASE)
                    
                    # Stage 2: Remove spatial/descriptive phrases
                    # These add location/arrangement info but aren't food names
                    spatial_phrases = [
                        r'\s+on\s+top\s+of',           # "on top of" -> ""
                        r'\s+on\s+(the\s+)?(left|right|top|bottom|center|middle|table|board|plate)',
                        r'\s+in\s+(the\s+)?(bowl|plate|dish|container|background|foreground)',
                        r'\s+at\s+(the\s+)?(left|right|top|bottom|center|middle)',
                        r'\s+with\s+(a\s+)?(cutting\s+board|wooden\s+table)',
                    ]
                    
                    for pattern in spatial_phrases:
                        answer = re.sub(pattern, ',', answer, flags=re.IGNORECASE)
                    
                    # Stage 3: Clean up leftover prepositions that create malformed names
                    # "parmesan cheese of blue sauce" -> "parmesan cheese, blue sauce"
                    answer = re.sub(r'\s+(of|with|from)\s+', ', ', answer, flags=re.IGNORECASE)
                    
                    # Stage 4: Clean up multiple commas and extra spaces
                    answer = re.sub(r',\s*,+', ',', answer)  # ",," -> ","
                    answer = re.sub(r'\s+', ' ', answer)     # Multiple spaces -> one space
                    answer = answer.strip(', ')
                    
                    print(f"    → Cleaned answer: {answer[:80]}...")
                    sys.stdout.flush()
                    
                    # Final check: if answer has no content words left after cleaning, skip it
                    if len(answer.strip()) < 3:
                        print(f"    ⚠ Skipping empty answer after cleaning")
                        sys.stdout.flush()
                        continue
                    
                    # Now validate the extracted/cleaned answer
                    # If it's still mostly question words, skip it
                    question_keywords = set([w for w in question_lower.split() if len(w) > 3])
                    answer_keywords = set([w for w in answer.lower().split() if len(w) > 3])
                    if len(question_keywords) > 0 and len(answer_keywords) > 0:
                        # Check what % of answer words are question words (not the other way around)
                        overlap_ratio = len(question_keywords.intersection(answer_keywords)) / len(answer_keywords)
                        if overlap_ratio > 0.5:  # More than 50% of answer is question words
                            print(f"    ⚠ Skipping answer that is mostly question words ({overlap_ratio:.1%})")
                            sys.stdout.flush()
                            continue
                    
                    # Remove task tokens
                    answer = answer.replace("<VQA>", "").replace("<|endoftext|>", "").strip()
                    answer_lower = answer.lower()
                    
                    # Remove "vqa" artifacts (case-insensitive)
                    answer = answer.replace("vqa", "").replace("VQA", "").replace("Vqa", "").replace("vQa", "").replace("vqA", "").strip()
                    # Remove "list" if it's at the start (from "List all the food items")
                    if answer.lower().startswith("list "):
                        answer = answer[5:].strip()
                    # Remove "all the food items" artifacts
                    answer = answer.replace("all the food items", "").replace("All the food items", "").strip()
                    # Remove standalone "list" word (artifact from "vQAList")
                    if answer.lower() == "list" or answer.lower().startswith("list "):
                        answer = answer[4:].strip() if len(answer) > 4 else ""
                    
                    # Only filter out completely empty or obviously invalid answers
                    answer_lower = answer.lower().strip()
                    if not answer_lower or answer_lower in ["", "vqa", "vqalist"]:
                        print(f"    ⚠ Skipping empty answer")
                        sys.stdout.flush()
                        continue
                    
                    # Accept any answer that has content (removed aggressive filtering)
                    if answer and len(answer.strip()) > 1:
                        print(f"    ✓ Answer: {answer[:100]}...")
                        sys.stdout.flush()
                        food_items.append(answer)
                except Exception as e:
                    logger.warning(f"VQA question '{question}' failed: {e}")
                    import traceback
                    logger.debug(traceback.format_exc())
            
            # Combine answers and extract food items with confidence scoring
            if food_items:
                # Count mentions across multiple VQA questions for confidence
                from collections import Counter
                food_mention_counts = Counter()  # Track how many times each food is mentioned
                
                for item in food_items:
                    # FLAN-T5 already formatted this as comma-separated
                    # Simple split by comma - no hardcoded patterns needed
                    parts = [p.strip() for p in item.split(",") if p.strip()]
                    
                    # Process each part - keep items as extracted without aggressive expansion
                    expanded_parts = []
                    for part in parts:
                        part = part.strip(".,;:!?").strip()
                        if not part:
                            continue
                        
                        # Use items as-is - trust Florence's natural word boundaries
                        # Grounding will filter out any that don't exist in the image
                        expanded_parts.append(part)
                    
                    for part in expanded_parts:
                        part = part.strip()
                        if not part or len(part) < 3:
                            continue
                        
                        # Basic validation: should contain at least one letter
                        if not any(c.isalpha() for c in part):
                            continue
                        
                        # Filter non-food items (containers, surfaces, utensils)
                        part_lower = part.lower()
                        non_food_keywords = [
                            'board', 'cutting', 'wooden', 'plate', 'bowl', 'dish', 
                            'table', 'surface', 'counter', 'tray', 'platter',
                            'napkin', 'fork', 'knife', 'spoon', 'glass', 'cup'
                        ]
                        if any(keyword in part_lower for keyword in non_food_keywords):
                            # Skip unless it's a compound food name like "cheese board"
                            if not any(food_word in part_lower for food_word in ['cheese', 'charcuterie']):
                                continue
                        
                        # Normalize to lowercase for counting
                        food_name_lower = part.lower().strip()
                        if len(food_name_lower) < 3:
                            continue
                        
                        # Count this mention
                        food_mention_counts[food_name_lower] += 1
                
                # Convert to final list
                all_food_mentions = []
                for food_lower, count in food_mention_counts.items():
                    # Title case for display
                    food_name = food_lower.title()
                    all_food_mentions.append(food_name)
                
                # Remove exact duplicates while preserving order
                seen = set()
                unique_foods = []
                for food in all_food_mentions:
                    food_lower = food.lower()
                    if food_lower not in seen:
                        seen.add(food_lower)
                        unique_foods.append(food)
                
                if unique_foods:
                    # Use VQA extracted food items directly - grounding only to get bounding boxes
                    combined_answer = ", ".join(unique_foods)
                    print(f"  → Extracted food items: {combined_answer}")
                    print(f"  → Getting bounding boxes via grounding...")
                    sys.stdout.flush()
                    
                    # Run grounding to get bounding boxes for SAM2 segmentation
                    grounding_results = self._run_florence2(
                        '<CAPTION_TO_PHRASE_GROUNDING>', combined_answer, image_pil, processor, model
                    )
                    grounding_data = grounding_results.get('<CAPTION_TO_PHRASE_GROUNDING>', {})
                    boxes = np.array(grounding_data.get("bboxes", []))
                    labels = grounding_data.get("labels", [])
                    
                    # Track items that VQA identified but grounding couldn't locate
                    # These are ingredients mixed into dishes (e.g., cheese in pasta)
                    grounded_items_lower = [l.lower() for l in labels]
                    unquantified_ingredients = []
                    for food in unique_foods:
                        # Check if this food item got a bounding box
                        if not any(food.lower() in grounded.lower() or grounded.lower() in food.lower() 
                                   for grounded in grounded_items_lower):
                            unquantified_ingredients.append(food)
                    
                    if unquantified_ingredients:
                        print(f"  → Detected but not localized (mixed ingredients): {', '.join(unquantified_ingredients)}")
                        sys.stdout.flush()
                    
                    # Use grounding results directly - no complex filtering
                    # Grounding naturally filters out items that don't exist (they won't get boxes)
                    caption = f"VQA detection: {combined_answer}"
                    print(f"  ✓ VQA complete: found {len(boxes)} objects with bounding boxes")
                    sys.stdout.flush()
                else:
                    # Fallback if no food items extracted
                    logger.warning("No food items extracted from VQA answers, falling back to OD")
                    od_results = self._run_florence2("<OD>", None, image_pil, processor, model)
                    od_data = od_results.get("<OD>", {})
                    boxes = np.array(od_data.get("bboxes", []))
                    labels = od_data.get("labels", [])
                    caption = f"VQA fallback to OD: {', '.join(labels) if len(labels) > 0 else 'none'}"
            else:
                # Fallback to OD if VQA fails
                logger.warning("VQA failed, falling back to OD")
                od_results = self._run_florence2("<OD>", None, image_pil, processor, model)
                od_data = od_results.get("<OD>", {})
                boxes = np.array(od_data.get("bboxes", []))
                labels = od_data.get("labels", [])
                caption = f"VQA fallback to OD: {', '.join(labels) if len(labels) > 0 else 'none'}"
            
            # Filter color hallucinations
            def filter_color_hallucinations(label):
                colors = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink']
                words = label.lower().split()
                filtered_words = []
                for i, word in enumerate(words):
                    if word in colors:
                        if i + 1 < len(words):
                            next_word = words[i + 1]
                            food_compounds = ['pepper', 'bean', 'rice', 'tea', 'coffee', 'sauce', 'bread', 'cheese']
                            if next_word not in food_compounds:
                                continue
                        else:
                            continue
                    filtered_words.append(word)
                result = ' '.join(filtered_words).strip()
                return result.capitalize() if result else label
            
            labels = [filter_color_hallucinations(label) for label in labels]
            boxes, labels = self._deduplicate_detections(boxes, labels)
            
        else:
            # Generate caption (caption-based detection for detailed labels)
            print(f"  → Generating caption ({self.config.caption_type})...")
            sys.stdout.flush()
            caption_task = self.TASK_PROMPTS[self.config.caption_type]
            # Note: Florence-2 requires task token to be the only text, so we can't add custom prompts
            caption_results = self._run_florence2(caption_task, None, image_pil, processor, model)
            caption = caption_results[caption_task]
            print(f"  ✓ Caption: {caption[:150]}...")
            sys.stdout.flush()
            
            # Phrase grounding
            print("  → Grounding phrases to bounding boxes...")
            sys.stdout.flush()
            grounding_results = self._run_florence2(
                '<CAPTION_TO_PHRASE_GROUNDING>', caption, image_pil, processor, model
            )
            print("  ✓ Grounding complete")
            sys.stdout.flush()
            grounding_data = grounding_results['<CAPTION_TO_PHRASE_GROUNDING>']
            
            boxes = np.array(grounding_data.get("bboxes", []))
            labels = grounding_data.get("labels", [])
            
            # Filter out color hallucinations from labels
            def filter_color_hallucinations(label):
                """Remove color adjectives that are likely hallucinations"""
                colors = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink']
                words = label.lower().split()
                filtered_words = []
                for i, word in enumerate(words):
                    if word in colors:
                        # Keep colors only if part of compound food names
                        if i + 1 < len(words):
                            next_word = words[i + 1]
                            food_compounds = ['pepper', 'bean', 'rice', 'tea', 'coffee', 'sauce', 'bread', 'cheese']
                            if next_word not in food_compounds:
                                continue  # Skip color word (likely hallucination)
                        else:
                            continue  # Skip standalone color words
                    filtered_words.append(word)
                result = ' '.join(filtered_words).strip()
                return result.capitalize() if result else label
            
            # Filter hallucinations from all labels
            labels = [filter_color_hallucinations(label) for label in labels]
            
            # Deduplicate caption-based detections (can have duplicates like "burgers" and "The burgers")
            boxes, labels = self._deduplicate_detections(boxes, labels)
        
        # Filter generic objects
        filtered_boxes = []
        filtered_labels = []
        for box, label in zip(boxes, labels):
            if label.lower() not in self.config.GENERIC_OBJECTS:
                box_area = (box[2] - box[0]) * (box[3] - box[1])
                if box_area >= self.config.MIN_BOX_AREA:
                    filtered_boxes.append(box)
                    filtered_labels.append(label)
        
        return np.array(filtered_boxes), filtered_labels, caption, unquantified_ingredients
    
    def _is_likely_hallucination(self, food_name: str) -> bool:
        """
        Detect if a food name is likely a hallucination based on unlikely combinations.
        
        Args:
            food_name: The food item name to check
            
        Returns:
            True if likely a hallucination, False otherwise
        """
        food_lower = food_name.lower()
        
        # Unlikely food combinations that suggest hallucinations
        unlikely_patterns = [
            # Fruit + savory combinations that are very rare
            r'blueberry.*(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle)',
            r'(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle).*blueberry',
            r'strawberry.*(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle)',
            r'(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle).*strawberry',
            r'apple.*(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle)',
            r'(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle).*apple',
            
            # Ice cream + savory combinations
            r'ice cream.*(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle|fries)',
            r'(cheeseburger|burger|sandwich|pizza|pasta|rice|noodle|fries).*ice cream',
            
            # Multiple unlikely modifiers together
            r'blueberry.*blueberry',  # Repeated unlikely words
            r'blue.*blue',  # Repeated color words
            
            # Very long compound names (often hallucinations)
            r'^.{40,}$',  # Names longer than 40 chars are suspicious
            
            # Unlikely combinations of common foods
            r'(fries|french fries).*(ice tea|tea|coffee|soda)',
            r'(ice tea|tea|coffee|soda).*(fries|french fries)',
        ]
        
        # Check against patterns
        for pattern in unlikely_patterns:
            if re.search(pattern, food_lower):
                return True
        
        # Check for multiple color words (except in legitimate contexts)
        color_words = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink']
        color_count = sum(1 for word in food_lower.split() if word in color_words)
        if color_count > 1:
            # Multiple colors in one food name is suspicious
            return True
        
        # Check for very specific unlikely combinations
        unlikely_combos = [
            'blueberry cheeseburger',
            'blueberry ice cream sandwich',
            'blueberry french fries',
            'blueberry ice tea',
            'blue cheeseburger',
            'blue ice cream',
        ]
        
        for combo in unlikely_combos:
            if combo in food_lower:
                return True
        
        return False
    
    def _deduplicate_detections(self, boxes, labels):
        """
        Remove duplicate detections that overlap significantly or are very close.
        Uses IoU, center distance, and label similarity to detect duplicates.
        """
        if len(boxes) == 0:
            return np.array([]), []
        
        # Normalize labels for comparison (remove articles, lowercase, handle plurals)
        def normalize_label(label):
            label_lower = label.lower().strip()
            # Remove articles
            for article in ['a ', 'an ', 'the ']:
                if label_lower.startswith(article):
                    label_lower = label_lower[len(article):].strip()
            # Handle plurals (simple: remove trailing 's')
            if label_lower.endswith('s') and len(label_lower) > 1:
                # Don't remove 's' from words like "glass" -> "glas"
                if label_lower not in ['glass', 'glasses', 'fries', 'nuggets']:
                    label_lower = label_lower[:-1]
            return label_lower
        
        normalized_labels = [normalize_label(l) for l in labels]
        
        # Track which boxes to keep
        keep = [True] * len(boxes)
        
        for i in range(len(boxes)):
            if not keep[i]:
                continue
            
            box_i = boxes[i]
            label_i = normalized_labels[i]
            
            # Calculate box center and size
            center_i = np.array([(box_i[0] + box_i[2]) / 2, (box_i[1] + box_i[3]) / 2])
            size_i = np.array([box_i[2] - box_i[0], box_i[3] - box_i[1]])
            area_i = size_i[0] * size_i[1]
            
            for j in range(i + 1, len(boxes)):
                if not keep[j]:
                    continue
                
                box_j = boxes[j]
                label_j = normalized_labels[j]
                
                # Check if labels are similar
                labels_similar = (label_i == label_j or 
                                 label_i in label_j or 
                                 label_j in label_i)
                
                if not labels_similar:
                    continue
                
                # Check IoU
                iou = self._calculate_iou(box_i, box_j)
                
                # Calculate center distance and size similarity
                center_j = np.array([(box_j[0] + box_j[2]) / 2, (box_j[1] + box_j[3]) / 2])
                size_j = np.array([box_j[2] - box_j[0], box_j[3] - box_j[1]])
                area_j = size_j[0] * size_j[1]
                
                center_dist = np.linalg.norm(center_i - center_j)
                avg_size = (size_i + size_j) / 2
                max_size = np.max(avg_size)
                
                # Size similarity (how similar are the box sizes)
                size_ratio = min(area_i, area_j) / max(area_i, area_j) if max(area_i, area_j) > 0 else 0
                
                # Consider duplicate if:
                # 1. High IoU (>20%) with same label, OR
                # 2. Same label + centers are close (<50% of average box size) + similar sizes (>60% size ratio), OR
                # 3. One box contains the other (large box contains smaller box of same label)
                is_duplicate = False
                
                # Check if one box contains the other
                def box_contains(box_a, box_b):
                    """Check if box_a contains box_b"""
                    return (box_a[0] <= box_b[0] and box_a[1] <= box_b[1] and 
                           box_a[2] >= box_b[2] and box_a[3] >= box_b[3])
                
                if iou > 0.2:
                    is_duplicate = True
                elif center_dist < max_size * 0.5 and size_ratio > 0.6:
                    is_duplicate = True
                elif box_contains(box_i, box_j) or box_contains(box_j, box_i):
                    # If one box contains another with same label, keep the smaller one (more specific)
                    if area_i > area_j * 1.5:  # box_i is much larger
                        keep[i] = False  # Remove the large box
                        break
                    elif area_j > area_i * 1.5:  # box_j is much larger
                        keep[j] = False  # Remove the large box
                    else:
                        is_duplicate = True
                
                if is_duplicate:
                    # Keep the one with larger area (more complete detection) or more descriptive label
                    if area_i >= area_j:
                        keep[j] = False
                    else:
                        keep[i] = False
                        break
        
        # Filter to keep only non-duplicates
        filtered_boxes = [boxes[i] for i in range(len(boxes)) if keep[i]]
        filtered_labels = [labels[i] for i in range(len(boxes)) if keep[i]]
        
        # Additional pass: Remove boxes that are too large (probably detecting groups)
        # Calculate average box area for each label
        if len(filtered_boxes) > 0:
            label_areas = {}
            for box, label in zip(filtered_boxes, filtered_labels):
                area = (box[2] - box[0]) * (box[3] - box[1])
                if label not in label_areas:
                    label_areas[label] = []
                label_areas[label].append(area)
            
            # Remove boxes that are much larger than average for their label
            final_boxes = []
            final_labels = []
            for i, (box, label) in enumerate(zip(filtered_boxes, filtered_labels)):
                area = (box[2] - box[0]) * (box[3] - box[1])
                avg_area = np.mean(label_areas[label])
                
                # If box is more than 3x larger than average, it's probably detecting a group
                if area > avg_area * 3 and len(label_areas[label]) > 1:
                    logger.info(f"Skipping oversized box for '{label}': area={area:.0f} vs avg={avg_area:.0f}")
                    continue
                
                final_boxes.append(box)
                final_labels.append(label)
            
            return np.array(final_boxes) if final_boxes else np.array([]), final_labels
        
        return np.array(filtered_boxes) if filtered_boxes else np.array([]), filtered_labels
    
    def _save_segmentation_masks(self, frame, masks_dict, tracked_objects, frame_idx, job_id):
        """Save SAM2 segmentation masks as images using matplotlib for better visualization"""
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        from matplotlib.colors import ListedColormap
        from pathlib import Path
        
        # Create masks directory
        masks_dir = self.config.OUTPUT_DIR / job_id / "masks"
        masks_dir.mkdir(parents=True, exist_ok=True)
        
        # Create overlay directory for visualization
        overlay_dir = self.config.OUTPUT_DIR / job_id / "masks_overlay"
        overlay_dir.mkdir(parents=True, exist_ok=True)
        
        # Convert BGR to RGB for matplotlib
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Generate distinct colors for each object
        import matplotlib.cm as cm
        num_objects = len(masks_dict)
        colors = cm.get_cmap('tab20', num_objects)(np.linspace(0, 1, num_objects))
        color_map = {obj_id: colors[i] for i, obj_id in enumerate(masks_dict.keys())}
        
        # Create figure for overlay
        fig, ax = plt.subplots(1, 1, figsize=(12, 12))
        ax.imshow(frame_rgb)
        ax.axis('off')
        
        # Save individual masks and add to overlay
        legend_elements = []
        for obj_id, mask in masks_dict.items():
            if obj_id not in tracked_objects:
                continue
                
            label = tracked_objects[obj_id]['label']
            
            # Handle mask shape (could be 2D or 3D)
            if len(mask.shape) == 3:
                mask_2d = mask[0]
            else:
                mask_2d = mask
            
            # Convert mask to uint8 (0 or 255) and save
            mask_uint8 = (mask_2d * 255).astype(np.uint8)
            safe_label = label.replace(' ', '_').replace('/', '_')[:50]
            mask_filename = masks_dir / f"frame_{frame_idx:05d}_obj_{obj_id}_{safe_label}.png"
            cv2.imwrite(str(mask_filename), mask_uint8)
            
            # Add colored mask to overlay using matplotlib
            color = color_map[obj_id]
            mask_bool = mask_2d.astype(bool)
            
            # Create colored mask overlay
            colored_mask = np.zeros((*mask_2d.shape, 4))
            colored_mask[mask_bool] = [*color[:3], 0.5]  # RGB + alpha
            
            ax.imshow(colored_mask)
            
            # Add label to legend
            legend_elements.append(mpatches.Patch(facecolor=color[:3], label=f"ID{obj_id}: {label}"))
        
        # Add legend
        if legend_elements:
            ax.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(0, 1), 
                     fontsize=8, framealpha=0.9)
        
        # Save overlay
        overlay_filename = overlay_dir / f"frame_{frame_idx:05d}_all_masks.png"
        plt.tight_layout()
        plt.savefig(str(overlay_filename), dpi=150, bbox_inches='tight', pad_inches=0)
        plt.close()
        
        # Upload segmented images to S3
        self._upload_segmented_images_to_s3(job_id, masks_dir, overlay_dir, frame_idx)
        
        logger.info(f"[{job_id}] Frame {frame_idx}: Saved {len(masks_dict)} segmentation masks to {masks_dir}")
    
    def _upload_segmented_images_to_s3(self, job_id: str, masks_dir: Path, overlay_dir: Path, frame_idx: int):
        """
        Upload segmented images (masks and overlays) to S3 for later retrieval.
        
        Structure:
        - For images: segmented_images/{job_id}/frame_00000/masks/ and overlays/
        - For videos: segmented_images/{job_id}/frame_00000/, frame_00001/, etc.
        """
        global s3_client
        
        if not S3_RESULTS_BUCKET:
            logger.warning(f"[{job_id}] S3_RESULTS_BUCKET not set, skipping S3 upload of segmented images")
            return
        
        try:
            # Initialize S3 client if not already done
            if s3_client is None:
                s3_client = boto3.client('s3')
            
            uploaded_count = 0
            frame_folder = f"frame_{frame_idx:05d}"
            
            # Upload individual mask files
            # Structure: segmented_images/{job_id}/frame_XXXXX/masks/mask_file.png
            mask_files = list(masks_dir.glob(f"frame_{frame_idx:05d}_*.png"))
            for mask_file in mask_files:
                # Extract just the filename (without the frame prefix since it's in the folder name)
                mask_filename = mask_file.name
                s3_key = f"segmented_images/{job_id}/{frame_folder}/masks/{mask_filename}"
                s3_client.upload_file(
                    str(mask_file),
                    S3_RESULTS_BUCKET,
                    s3_key,
                    ExtraArgs={'ContentType': 'image/png'}
                )
                uploaded_count += 1
                logger.info(f"[{job_id}] Uploaded mask to s3://{S3_RESULTS_BUCKET}/{s3_key}")
            
            # Upload overlay file
            # Structure: segmented_images/{job_id}/frame_XXXXX/overlays/all_masks.png
            overlay_file = overlay_dir / f"frame_{frame_idx:05d}_all_masks.png"
            if overlay_file.exists():
                s3_key = f"segmented_images/{job_id}/{frame_folder}/overlays/all_masks.png"
                s3_client.upload_file(
                    str(overlay_file),
                    S3_RESULTS_BUCKET,
                    s3_key,
                    ExtraArgs={'ContentType': 'image/png'}
                )
                uploaded_count += 1
                logger.info(f"[{job_id}] Uploaded overlay to s3://{S3_RESULTS_BUCKET}/{s3_key}")
            
            logger.info(f"[{job_id}] Frame {frame_idx}: Uploaded {uploaded_count} segmented images to S3 (bucket: {S3_RESULTS_BUCKET}, path: segmented_images/{job_id}/{frame_folder}/)")
            
        except Exception as e:
            logger.error(f"[{job_id}] Failed to upload segmented images to S3: {e}", exc_info=True)
            # Don't fail the entire pipeline if S3 upload fails
    
    def _calculate_iou(self, box1, box2):
        """Calculate Intersection over Union (IoU) between two boxes"""
        # Box format: [x1, y1, x2, y2]
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        # Calculate intersection
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        
        # Calculate union
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = box1_area + box2_area - inter_area
        
        if union_area == 0:
            return 0.0
        
        return inter_area / union_area
    
    def _run_florence2(self, task_prompt, text_input, image, processor, model):
        """Run Florence-2 inference"""
        prompt = task_prompt if text_input is None else task_prompt + text_input
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(self.device)
        
        # Use configurable generation parameters for longer, more detailed captions
        generation_kwargs = {
            "input_ids": inputs["input_ids"],
            "pixel_values": inputs["pixel_values"],
            "max_new_tokens": self.config.FLORENCE2_MAX_NEW_TOKENS,
            "early_stopping": False,
            "use_cache": False,
        }
        
        # Add beam search for better quality (especially for captions)
        if self.config.FLORENCE2_NUM_BEAMS > 1:
            generation_kwargs["num_beams"] = self.config.FLORENCE2_NUM_BEAMS
        
        # Add sampling parameters if enabled (for more diverse outputs)
        if self.config.FLORENCE2_DO_SAMPLE:
            generation_kwargs["do_sample"] = True
            generation_kwargs["temperature"] = self.config.FLORENCE2_TEMPERATURE
        
        # Add min_length for caption and VQA tasks to encourage longer, more detailed outputs
        if task_prompt in ["<CAPTION>", "<DETAILED_CAPTION>", "<MORE_DETAILED_CAPTION>"]:
            generation_kwargs["min_length"] = self.config.FLORENCE2_MIN_LENGTH
        elif task_prompt == "<VQA>":
            # Use VQA-specific min_length for more complete answers
            generation_kwargs["min_length"] = self.config.FLORENCE2_VQA_MIN_LENGTH
        
        with torch.no_grad():
            generated_ids = model.generate(**generation_kwargs)
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        
        # Debug: Log generated text for VQA tasks
        if task_prompt == "<VQA>":
            logger.debug(f"Generated text before post-processing: '{generated_text[:500]}'")
        
        parsed_answer = processor.post_process_generation(
            generated_text, task=task_prompt, image_size=(image.width, image.height)
        )
        
        # Debug: Log parsed answer for VQA tasks
        if task_prompt == "<VQA>":
            logger.debug(f"Parsed answer after post-processing: {parsed_answer}")
        
        return parsed_answer
    
    def _match_objects(self, new_boxes, new_labels, tracked_objects):
        """Match new detections to existing tracked objects"""
        matched_mapping = {}
        unmatched_new = list(range(len(new_boxes)))
        
        if not tracked_objects:
            return matched_mapping, unmatched_new
        
        # Simple IoU matching
        for new_idx, new_box in enumerate(new_boxes):
            best_iou = 0
            best_id = None
            
            for obj_id, obj_data in tracked_objects.items():
                old_box = obj_data['box']
                iou = self._compute_iou(new_box, old_box)
                
                if iou > best_iou and iou >= self.config.IOU_MATCH_THRESHOLD:
                    best_iou = iou
                    best_id = obj_id
            
            if best_id is not None:
                matched_mapping[best_id] = new_idx
                unmatched_new.remove(new_idx)
        
        return matched_mapping, unmatched_new
    
    def _compute_iou(self, box1, box2):
        """Compute Intersection over Union"""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        
        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0
    
    def _estimate_depth_metric3d(self, frame_np, model):
        """Estimate depth using Metric3D (returns meters)"""
        rgb_input = torch.from_numpy(frame_np).permute(2, 0, 1).unsqueeze(0).float().to(self.device)
        
        with torch.no_grad():
            pred_depth, confidence, output_dict = model.inference({'input': rgb_input})
        
        depth_map_meters = pred_depth.squeeze().cpu().numpy()
        
        # Resize if needed
        if depth_map_meters.shape != frame_np.shape[:2]:
            depth_map_meters = cv2.resize(
                depth_map_meters, (frame_np.shape[1], frame_np.shape[0]),
                interpolation=cv2.INTER_LINEAR
            )
        
        return depth_map_meters
    
    def _calibrate_from_reference_object(self, ref_box, depth_map_meters, frame_width, ref_type='plate'):
        """
        Calibrate pixel scale using reference object (plate or bowl) with known size
        
        Args:
            ref_box: Bounding box of reference object
            depth_map_meters: Depth map from Metric3D
            frame_width: Width of frame in pixels
            ref_type: 'plate' or 'bowl'
        
        Returns:
            (pixels_per_cm, reference_depth_m)
        """
        x1, y1, x2, y2 = [int(v) for v in ref_box]
        ref_width_px = x2 - x1
        ref_height_px = y2 - y1

        # Get reference diameter based on type
        if ref_type == 'plate':
            ref_diameter_cm = self.config.REFERENCE_PLATE_DIAMETER_CM
        elif ref_type == 'bowl':
            ref_diameter_cm = self.config.REFERENCE_BOWL_DIAMETER_CM
        else:
            ref_diameter_cm = self.config.REFERENCE_PLATE_DIAMETER_CM  # Default

        # Calculate potential calibration
        pixels_per_cm = ref_width_px / ref_diameter_cm

        # Validation: Check if this is a reasonable detection
        aspect_ratio = ref_width_px / max(ref_height_px, 1)
        is_reasonable = (
            0.6 < aspect_ratio < 1.5 and  # Roughly circular/oval
            ref_width_px > 50 and  # Not too small
            pixels_per_cm > 3.0 and  # Minimum reasonable scale
            pixels_per_cm < 30.0  # Maximum reasonable scale for 800px image
        )

        if not is_reasonable:
            logger.warning(f"{ref_type.capitalize()} detection unreliable (width={ref_width_px}px, aspect={aspect_ratio:.2f}, px/cm={pixels_per_cm:.2f})")
            # Use depth-based fallback calibration
            ref_region = depth_map_meters[y1:y2, x1:x2]
            avg_depth_m = np.median(ref_region[ref_region > 0])

            # Fallback: use general calibration value from config
            pixels_per_cm = self.config.DEFAULT_PIXELS_PER_CM
            logger.info(f"Using general calibration fallback: {pixels_per_cm:.2f} px/cm")

            return pixels_per_cm, avg_depth_m if avg_depth_m > 0 else 0.5

        # Reference object detection looks good, use it
        ref_region = depth_map_meters[y1:y2, x1:x2]
        avg_ref_depth_m = np.median(ref_region[ref_region > 0])

        logger.info(f"✓ {ref_type.capitalize()} calibration: {pixels_per_cm:.2f} px/cm, depth: {avg_ref_depth_m:.2f}m")
        return pixels_per_cm, avg_ref_depth_m
    
    def _calibrate_from_surface(self, surface_box, depth_map_meters, frame_width):
        """
        Calibrate reference plane depth from table/surface (no known size)
        
        Args:
            surface_box: Bounding box of surface/table
            depth_map_meters: Depth map from Metric3D
            frame_width: Width of frame in pixels
        
        Returns:
            reference_plane_depth_m
        """
        x1, y1, x2, y2 = [int(v) for v in surface_box]
        surface_region = depth_map_meters[y1:y2, x1:x2]
        valid_depths = surface_region[surface_region > 0]
        
        if len(valid_depths) > 0:
            # Use median depth of surface as reference plane
            reference_depth_m = np.median(valid_depths)
            logger.info(f"✓ Surface reference plane: {reference_depth_m:.3f}m")
        else:
            # Fallback: use median of entire scene, or config default
            scene_depths = depth_map_meters[depth_map_meters > 0]
            if len(scene_depths) > 0:
                reference_depth_m = np.median(scene_depths)
                logger.info(f"Using scene median as reference plane: {reference_depth_m:.3f}m")
            else:
                reference_depth_m = self.config.DEFAULT_REFERENCE_PLANE_DEPTH_M
                logger.warning(f"Using default reference plane depth: {reference_depth_m:.3f}m")
        
        return reference_depth_m
    
    def _calculate_volume_metric3d(self, mask, depth_map_meters, box, label):
        """Calculate volume using metric depth (implementation from test_tracking_metric3d.py)"""
        # This is a simplified version - full implementation in the original file
        mask_bool = mask.astype(bool)
        depth_values_m = depth_map_meters[mask_bool]
        
        if len(depth_values_m) == 0 or not self.calibration['calibrated']:
            return {'volume_ml': 0.0, 'avg_height_cm': 0.0, 'surface_area_cm2': 0.0}
        
        pixel_count = mask_bool.sum()
        pixels_per_cm = self.calibration['pixels_per_cm']
        surface_area_cm2 = pixel_count / (pixels_per_cm ** 2)
        
        valid_depths = depth_values_m[depth_values_m > 0]
        if len(valid_depths) == 0:
            return {'volume_ml': 0.0, 'avg_height_cm': 0.0, 'surface_area_cm2': surface_area_cm2}
        
        # Height calculation: Use reference plane (plate) as baseline
        # Calculate height relative to reference plane, not absolute depth difference
        reference_plane_depth_m = self.calibration.get('reference_plane_depth_m')
        
        if reference_plane_depth_m is not None and reference_plane_depth_m > 0:
            # Use reference plane approach: height = reference_plane_depth - object_top_depth
            # This gives us the height of the object above the plate/surface
            object_top_depth_m = np.percentile(valid_depths, 10)  # Top 10% = closest to camera (top of object)
            object_bottom_depth_m = np.percentile(valid_depths, 90)  # Bottom 90% = farthest (bottom/base)
            
            # Height is the difference from reference plane to top of object
            # If object is above reference plane, height is positive
            height_above_plane_m = reference_plane_depth_m - object_top_depth_m
            
            # Also check depth variation within object (for objects with significant height)
            depth_variation_m = object_bottom_depth_m - object_top_depth_m
            
            # Use the larger of: height above plane OR depth variation within object
            # This handles both cases: objects on plate vs objects with internal height
            raw_height_cm = max(height_above_plane_m, depth_variation_m) * 100
            raw_height_cm = max(0, raw_height_cm)  # Ensure non-negative
            
            logger.debug(f"Height calculation for {label}: reference_plane={reference_plane_depth_m:.3f}m, "
                        f"top={object_top_depth_m:.3f}m, height_above_plane={height_above_plane_m*100:.2f}cm, "
                        f"depth_variation={depth_variation_m*100:.2f}cm, final={raw_height_cm:.2f}cm")
        else:
            # Fallback: use depth variation within object (old method)
            base_depth_m = np.percentile(valid_depths, 75)  # Bottom of object
            top_depth_m = np.percentile(valid_depths, 15)   # Top of object
            depth_diff_m = base_depth_m - top_depth_m
            raw_height_cm = max(0, depth_diff_m * 100)
            logger.warning(f"No reference plane - using depth variation method for {label}")
        
        # General approach: Estimate reasonable height based on object size
        # Larger surface area → potentially taller object, but cap at reasonable limits
        # Use surface area to estimate if object is "flat" (fries) or "tall" (burger)
        
        # Estimate object diameter from surface area (assuming roughly circular)
        # diameter_cm ≈ 2 * sqrt(area / π)
        estimated_diameter_cm = 2 * np.sqrt(surface_area_cm2 / np.pi)
        
        # General height estimation: height should be proportional to size but capped
        # For food items, height is typically 10-30% of diameter for most items
        # Flat items (fries): 2-5% of diameter
        # Tall items (burgers): 20-40% of diameter
        
        label_lower = label.lower()
        
        # Detect flat items (fries, chips, etc.) - very low height-to-diameter ratio
        is_flat_item = any(word in label_lower for word in ['fries', 'chips', 'crisps', 'potato', 'flat'])
        
        if 'plate' in label_lower:
            height_cm = min(raw_height_cm, 2.5) if raw_height_cm > 5 else max(raw_height_cm, 1.5)
        elif any(word in label_lower for word in ['glass', 'cup']):
            height_cm = max(raw_height_cm, 8) if raw_height_cm < 3 else min(raw_height_cm, 15)
        elif is_flat_item:
            # Flat items: height should be very small relative to diameter
            height_cm = min(raw_height_cm, estimated_diameter_cm * 0.05)  # Max 5% of diameter
            height_cm = max(height_cm, 0.3)  # But at least 0.3cm
            height_cm = min(height_cm, 2.0)  # Cap at 2cm
        else:
            # General food items: height is typically 15-30% of diameter
            # But cap at reasonable maximums based on object size
            height_from_diameter = estimated_diameter_cm * 0.25  # 25% of diameter
            height_cm = min(raw_height_cm, height_from_diameter)
            # Cap based on absolute size: larger objects can be taller
            if estimated_diameter_cm < 5:  # Small items (<5cm diameter)
                height_cm = min(height_cm, 3.0)
            elif estimated_diameter_cm < 10:  # Medium items (5-10cm)
                height_cm = min(height_cm, 6.0)
            else:  # Large items (>10cm)
                height_cm = min(height_cm, 10.0)
            # Ensure minimum height
            height_cm = max(height_cm, 1.0)
        
        # General shape factor: accounts for irregular shapes and air gaps
        # Most food items are not perfect cylinders, so reduce volume
        # Smaller items tend to have more air gaps (lower factor)
        # Larger items are more solid (higher factor)
        
        if is_flat_item:
            shape_factor = 0.4  # Very irregular, lots of air
        elif estimated_diameter_cm < 5:
            shape_factor = 0.5  # Small items: more air gaps
        elif estimated_diameter_cm < 10:
            shape_factor = 0.6  # Medium items: moderate air gaps
        else:
            shape_factor = 0.65  # Large items: less air, more solid
        
        volume_ml = surface_area_cm2 * height_cm * shape_factor
        
        # Debug logging
        logger.info(f"Volume calculation for {label}: area={surface_area_cm2:.2f}cm², height={height_cm:.2f}cm, "
                   f"shape_factor={shape_factor:.2f}, diameter={estimated_diameter_cm:.2f}cm, "
                   f"raw_volume={volume_ml:.2f}ml")
        
        # Final validation: Cap volume at reasonable maximum
        # Calculate max reasonable volume based on diameter
        max_reasonable_volume_from_diameter = (estimated_diameter_cm ** 3) * 0.5
        
        # Also cap based on typical food volumes (stricter limits)
        typical_max_volumes = {
            'burger': 500, 'sandwich': 500, 'cheeseburger': 500, 'hamburger': 500,
            'fries': 200, 'french fries': 200, 'potato': 200,
            'pizza': 1000, 'salad': 500, 'soup': 500,
            'ice cream': 300, 'nugget': 100, 'chicken': 300
        }
        
        # Check if label matches any typical food
        matched_max = None
        for food_type, max_vol in typical_max_volumes.items():
            if food_type in label_lower:
                matched_max = max_vol
                break
        
        # Use the stricter limit (either diameter-based or food-specific)
        if matched_max:
            max_reasonable_volume = min(max_reasonable_volume_from_diameter, matched_max)
        else:
            max_reasonable_volume = max_reasonable_volume_from_diameter
        
        # Always cap at absolute maximum (1000ml) for safety
        max_reasonable_volume = min(max_reasonable_volume, 1000.0)
        
        if volume_ml > max_reasonable_volume:
            old_volume = volume_ml
            volume_ml = max_reasonable_volume
            logger.warning(f"⚠️ Volume capped from {old_volume:.1f}ml to {max_reasonable_volume:.1f}ml for '{label}' "
                          f"(diameter: {estimated_diameter_cm:.1f}cm, area: {surface_area_cm2:.1f}cm², height: {height_cm:.2f}cm)")
        
        # Gemini validation: Ask Gemini if this volume seems reasonable
        if self.config.GEMINI_API_KEY:
            validated_volume = self._validate_volume_with_gemini(
                food_name=label,
                calculated_volume_ml=volume_ml,
                height_cm=height_cm,
                area_cm2=surface_area_cm2,
                diameter_cm=estimated_diameter_cm
            )
            if validated_volume is not None and validated_volume != volume_ml:
                logger.info(f"✓ Gemini adjusted volume for '{label}': {volume_ml:.1f}ml → {validated_volume:.1f}ml")
                volume_ml = validated_volume
        
        return {
            'volume_ml': float(volume_ml),
            'avg_height_cm': float(height_cm),
            'surface_area_cm2': float(surface_area_cm2)
        }
    
    def _validate_volume_with_gemini(self, food_name, calculated_volume_ml, height_cm, area_cm2, diameter_cm):
        """Use Gemini to validate if calculated volume is reasonable, return adjusted volume if needed"""
        try:
            import google.generativeai as genai
            import time
            # Add small delay to avoid rate limiting
            time.sleep(0.2)
            genai.configure(api_key=self.config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            prompt = f"""You are a food portion estimation expert. Analyze this volume calculation:

Food: {food_name}
Calculated Volume: {calculated_volume_ml:.1f} ml
Surface Area: {area_cm2:.1f} cm²
Height: {height_cm:.2f} cm
Estimated Diameter: {diameter_cm:.1f} cm

Task: Check if this volume is reasonable for a TYPICAL RESTAURANT/HOME SERVING of this food.

❌ CORRECT these cases:
1. Measurement failures (height too low for vertical items, can't see inside containers)
2. Unrealistic portion sizes (way too large for typical serving)

Common serving sizes:
- Ribs: 200-400ml (2-4 ribs)
- Burger: 150-250ml (single burger)
- Fries: 150-300ml (side serving)
- Pasta: 300-500ml (main dish)
- Pizza slice: 200-300ml
- Chicken nuggets: 100-200ml (4-6 nuggets)
- Vegetables/sides: 100-200ml
- Drinks: 250-500ml
- Sauces/condiments: 30-100ml

✅ TRUST these volumes:
- Flat foods (pasta, pizza) with good measurements
- Multiple items combined (e.g., burger + toppings)
- Family-style portions (if explicitly multiple servings)

Respond ONLY with a JSON object:
{{
  "is_reasonable": true/false,
  "reason": "brief explanation",
  "suggested_volume_ml": number (only if unreasonable)
}}

Examples:
{{"is_reasonable": false, "reason": "1000ml too large for typical ribs serving (2-4 ribs = 200-400ml)", "suggested_volume_ml": 300}}
{{"is_reasonable": false, "reason": "Height 0.49cm too low for fries", "suggested_volume_ml": 150}}
{{"is_reasonable": true, "reason": "Reasonable pasta serving size"}}"""

            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            import json
            # Handle markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            
            if not result.get('is_reasonable', True):
                suggested_volume = result.get('suggested_volume_ml')
                reason = result.get('reason', 'No reason provided')
                logger.info(f"Gemini volume validation for '{food_name}': {reason}")
                if suggested_volume and suggested_volume > 0:
                    return float(suggested_volume)
            
            # If reasonable or no suggestion, return original
            return calculated_volume_ml
            
        except Exception as e:
            logger.warning(f"Gemini volume validation failed: {e}")
            return calculated_volume_ml
    
    def _filter_non_food_with_gemini(self, boxes, labels, job_id, frame_idx):
        """Use Gemini to filter out non-food items from detected objects"""
        try:
            import google.generativeai as genai
            import time
            time.sleep(0.2)  # Rate limiting
            genai.configure(api_key=self.config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Create list of detected items
            items_list = ", ".join([f'"{label}"' for label in labels])
            
            prompt = f"""You are analyzing detected objects from a food image. Some detections might be errors (e.g., text overlays, UI elements, non-food objects).

Detected items: {items_list}

Identify which items are ACTUAL FOOD or BEVERAGES that should be included in nutrition analysis.

Rules:
- Include: Any food, ingredients, beverages, condiments
- Exclude: Text overlays (like "VQA", "question", "instruction"), UI elements, non-edible objects

Respond ONLY with a JSON array of the food items to KEEP:
{{"food_items": ["item1", "item2", ...]}}

If none are food, respond: {{"food_items": []}}"""

            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            import json
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            food_items = [item.lower() for item in result.get('food_items', [])]
            
            # Filter boxes and labels based on Gemini's response
            filtered_boxes = []
            filtered_labels = []
            for box, label in zip(boxes, labels):
                if label.lower() in food_items:
                    filtered_boxes.append(box)
                    filtered_labels.append(label)
                else:
                    logger.info(f"[{job_id}] Frame {frame_idx}: Gemini filtered out non-food: '{label}'")
            
            return filtered_boxes, filtered_labels
            
        except Exception as e:
            logger.warning(f"[{job_id}] Frame {frame_idx}: Gemini filtering failed: {e}, keeping all detections")
            return boxes.tolist() if hasattr(boxes, 'tolist') else boxes, labels
    
    def _deduplicate_objects_with_gemini(self, tracking_results, job_id):
        """Use Gemini to merge duplicate objects detected across different frames with different labels"""
        if not self.config.GEMINI_API_KEY:
            return tracking_results
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Skip non-food items
            skip_keywords = [
                'question', 'vqa', 'text', 'plate', 'platter', 'fork', 'knife', 'spoon', 
                'glass', 'cup', 'mug', 'bottle', 'table', 'bowl', 'container'
            ]
            
            # Build list of all detected objects with their metadata
            objects_summary = []
            valid_obj_ids = []
            
            for obj_id, obj_data in tracking_results['objects'].items():
                label = obj_data['label']
                
                # Filter out non-food items
                if any(keyword in label.lower() for keyword in skip_keywords):
                    logger.info(f"[{job_id}] Filtering out non-food item: {label}")
                    continue
                
                volume = obj_data['statistics']['max_volume_ml']
                area = obj_data['statistics']['max_area_cm2']
                objects_summary.append(f"ID{obj_id}: {label} (volume: {volume:.1f}ml, area: {area:.1f}cm²)")
                valid_obj_ids.append((obj_id, obj_data))
            
            if len(valid_obj_ids) <= 1:
                # Nothing to deduplicate
                return tracking_results
            
            prompt = f"""Analyze this list of detected food objects from a video. Some objects may be the SAME physical item detected with different labels across frames. Identify which objects should be MERGED as duplicates.

Detected Objects:
{chr(10).join(objects_summary)}

Rules for merging:
- **MERGE** if labels refer to the SAME food type (e.g., "Ribs" and "Meat" are likely the same item, "Mashed Potatoes" and "Potatoes" are the same)
- **MERGE** if volumes/areas are very similar AND labels are related (e.g., two "Beans" with 50ml each = likely same)
- **KEEP SEPARATE** if labels are clearly different foods (e.g., "Ribs" vs "Beans", "Fries" vs "Cola")
- **KEEP SEPARATE** if same label but volumes are significantly different (different servings)

Respond ONLY with JSON listing merge groups:
{{
  "merge_groups": [
    {{"ids": ["ID1", "ID3"], "reason": "Both are meat/ribs"}},
    {{"ids": ["ID2", "ID5"], "reason": "Both are potatoes with similar volume"}}
  ],
  "keep_separate": ["ID4", "ID6"]
}}

If no duplicates, respond: {{"merge_groups": [], "keep_separate": ["ID1", "ID2", ...]}}"""

            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            import json
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            decisions = json.loads(response_text)
            merge_groups = decisions.get('merge_groups', [])
            
            if not merge_groups:
                logger.info(f"[{job_id}] No duplicates to merge")
                return tracking_results
            
            # Apply merges
            merged_objects = {}
            merged_ids = set()
            
            for group in merge_groups:
                ids_to_merge = group['ids']
                reason = group.get('reason', 'duplicate')
                
                # Extract numeric IDs (e.g., "ID1" -> 1)
                numeric_ids = []
                for id_str in ids_to_merge:
                    try:
                        numeric_id = int(id_str.replace('ID', ''))
                        numeric_ids.append(numeric_id)
                    except ValueError:
                        continue
                
                if len(numeric_ids) < 2:
                    continue  # Need at least 2 to merge
                
                # Find the objects to merge
                objects_to_merge = []
                for obj_id, obj_data in valid_obj_ids:
                    if obj_id in numeric_ids:
                        objects_to_merge.append((obj_id, obj_data))
                
                if len(objects_to_merge) < 2:
                    continue
                
                # Merge: keep the one with highest volume
                objects_to_merge.sort(key=lambda x: x[1]['statistics']['max_volume_ml'], reverse=True)
                primary_id, primary_data = objects_to_merge[0]
                
                # Aggregate volumes and metadata
                total_volume = sum(obj[1]['statistics']['max_volume_ml'] for obj in objects_to_merge)
                max_area = max(obj[1]['statistics']['max_area_cm2'] for obj in objects_to_merge)
                max_height = max(obj[1]['statistics']['max_height_cm'] for obj in objects_to_merge)
                
                # Use the most descriptive label (longest or most specific)
                labels = [obj[1]['label'] for obj in objects_to_merge]
                best_label = max(labels, key=len)
                
                # Create merged object
                merged_data = primary_data.copy()
                merged_data['label'] = best_label
                merged_data['statistics']['max_volume_ml'] = total_volume
                merged_data['statistics']['mean_volume_ml'] = total_volume
                merged_data['statistics']['median_volume_ml'] = total_volume
                merged_data['statistics']['max_area_cm2'] = max_area
                merged_data['statistics']['max_height_cm'] = max_height
                
                merged_objects[primary_id] = merged_data
                
                for obj_id, _ in objects_to_merge:
                    merged_ids.add(obj_id)
                
                merged_labels = ', '.join(labels)
                logger.info(f"[{job_id}] ✓ Merged [{merged_labels}] → '{best_label}' (total: {total_volume:.1f}ml). Reason: {reason}")
            
            # Add non-merged objects
            for obj_id, obj_data in valid_obj_ids:
                if obj_id not in merged_ids:
                    merged_objects[obj_id] = obj_data
            
            tracking_results['objects'] = merged_objects
            return tracking_results
            
        except Exception as e:
            logger.warning(f"[{job_id}] Gemini deduplication failed: {e}", exc_info=True)
            return tracking_results
    
    def _combine_similar_items(self, tracking_results):
        """Use Gemini to intelligently combine garnishes/small ingredients while keeping main dishes separate"""
        if not self.config.GEMINI_API_KEY:
            return tracking_results  # Skip if no Gemini key
        
        try:
            import google.generativeai as genai
            import time
            time.sleep(0.2)  # Rate limiting
            genai.configure(api_key=self.config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Build list of items with their counts
            item_groups = {}
            for obj_id, obj_data in tracking_results['objects'].items():
                label = obj_data['label']
                volume = obj_data['statistics']['max_volume_ml']
                
                if label not in item_groups:
                    item_groups[label] = []
                item_groups[label].append({
                    'obj_id': obj_id,
                    'volume': volume,
                    'data': obj_data
                })
            
            # Ask Gemini which items should be combined
            items_summary = []
            for label, instances in item_groups.items():
                volumes_str = [f"{i['volume']:.1f}ml" for i in instances]
                items_summary.append(f"{label}: {len(instances)} instances, volumes: {volumes_str}")
            
            prompt = f"""Analyze this list of detected food items and decide which should be combined vs kept separate:

{chr(10).join(items_summary)}

Rules:
- **Combine**: Small garnishes (parsley, herbs), condiments, sauces - these are sprinkled/spread across the dish
- **Keep Separate**: Main dishes (burgers, pizzas, servings), distinct portions (multiple fries containers, multiple drinks)

Respond ONLY with JSON:
{{
  "combine": ["item_name1", "item_name2"],  // Items to combine (garnishes, small ingredients)
  "keep_separate": ["item_name3", "item_name4"]  // Items to keep as individual servings
}}

Example:
{{"combine": ["Parsley", "Basil", "Sauce"], "keep_separate": ["Hamburger", "Fries", "Cola"]}}"""

            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            import json
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            decisions = json.loads(response_text)
            combine_items = [item.lower() for item in decisions.get('combine', [])]
            
            # Combine items that Gemini suggested
            new_objects = {}
            combined_ids = set()
            
            for label, instances in item_groups.items():
                if label.lower() in combine_items and len(instances) > 1:
                    # Combine all instances into one
                    total_volume = sum(i['volume'] for i in instances)
                    first_instance = instances[0]
                    
                    # Create combined entry
                    combined_id = first_instance['obj_id']
                    new_objects[combined_id] = first_instance['data'].copy()
                    new_objects[combined_id]['statistics']['max_volume_ml'] = total_volume
                    new_objects[combined_id]['statistics']['mean_volume_ml'] = total_volume
                    new_objects[combined_id]['statistics']['median_volume_ml'] = total_volume
                    
                    # Mark other instances as combined
                    for i in instances:
                        combined_ids.add(i['obj_id'])
                    
                    logger.info(f"Combined {len(instances)} instances of '{label}' into 1 ({total_volume:.1f}ml total)")
                else:
                    # Keep separate
                    for instance in instances:
                        new_objects[instance['obj_id']] = instance['data']
            
            # Update tracking results
            tracking_results['objects'] = new_objects
            return tracking_results
            
        except Exception as e:
            logger.warning(f"Gemini item combining failed: {e}, keeping items as-is")
            return tracking_results
    
    def _analyze_nutrition(self, tracking_results, job_id):
        """Run nutrition analysis using RAG system"""
        logger.info(f"[{job_id}] Running nutrition analysis...")
        
        # Step 1: Deduplicate objects detected across frames (e.g., "Ribs" + "Meat" = same item)
        if self.config.GEMINI_API_KEY:
            tracking_results = self._deduplicate_objects_with_gemini(tracking_results, job_id)
        
        # Step 2: Combine similar items (garnishes, small ingredients)
        if self.config.GEMINI_API_KEY:
            tracking_results = self._combine_similar_items(tracking_results)
        
        rag = self.models.rag
        
        skip_keywords = [
            'plate', 'platter', 'fork', 'knife', 'spoon', 'glass', 'cup', 'mug', 'bottle',
            'table', 'bowl', 'water', 'sprinkle', 'surface', 'wooden', 'board', 'cutting board',
            'background', 'setting', 'scene', 'some other', 'other objects', 'object',
            'container', 'napkin', 'tissue', 'placemat', 'mat'
        ]
        
        nutrition_items = []
        total_food_volume = 0
        total_mass = 0
        total_calories = 0
        
        for item_key, item_data in tracking_results['objects'].items():
            label = item_data['label']
            max_volume = item_data['statistics']['max_volume_ml']
            
            # Skip non-food items
            if any(keyword in label.lower() for keyword in skip_keywords):
                continue
            
            # Get nutrition info for all food items, no volume threshold
            nutrition = rag.get_nutrition_for_food(label, max_volume)
            nutrition_items.append(nutrition)
            
            total_food_volume += max_volume
            total_mass += nutrition['mass_g']
            total_calories += nutrition['total_calories']
        
        # Collect unquantified ingredients from florence_detections
        all_unquantified = []
        for detection in self.florence_detections:
            if 'unquantified_ingredients' in detection:
                all_unquantified.extend(detection['unquantified_ingredients'])
        
        # Remove duplicates while preserving order
        unique_unquantified = []
        seen = set()
        for item in all_unquantified:
            if item.lower() not in seen:
                unique_unquantified.append(item)
                seen.add(item.lower())
        
        result = {
            'items': nutrition_items,
            'summary': {
                'total_food_volume_ml': total_food_volume,
                'total_mass_g': total_mass,
                'total_calories_kcal': total_calories,
                'num_food_items': len(nutrition_items)
            }
        }
        
        # Add unquantified ingredients if any were detected
        if unique_unquantified:
            result['unquantified_ingredients'] = unique_unquantified
        
        return result

