import os
import sys
import time
import base64
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from pathlib import Path
from shapely.geometry import Polygon
import torch
from ultralytics import YOLO

# 15 DOTA v1.0 Classes
DOTA_CLASSES = [
    "plane", "ship", "storage-tank", "baseball-diamond", "tennis-court",
    "basketball-court", "ground-track-field", "harbor", "bridge", "large-vehicle",
    "small-vehicle", "helicopter", "roundabout", "soccer-ball-field", "swimming-pool"
]

CLASS_COLORS = {
    "plane": (59, 130, 246),           # Blue
    "ship": (6, 182, 212),             # Cyan
    "storage-tank": (139, 92, 246),    # Purple
    "baseball-diamond": (249, 115, 22),# Orange
    "tennis-court": (16, 185, 129),    # Emerald
    "basketball-court": (236, 72, 153),# Pink
    "ground-track-field": (132, 204, 22),# Lime
    "harbor": (2, 132, 199),           # Sky
    "bridge": (100, 116, 139),         # Slate
    "large-vehicle": (239, 68, 68),    # Red
    "small-vehicle": (245, 158, 11),   # Amber
    "helicopter": (99, 102, 241),      # Indigo
    "roundabout": (20, 184, 166),      # Teal
    "soccer-ball-field": (34, 197, 94),# Green
    "swimming-pool": (56, 189, 248)    # Light Blue
}

def get_color_bgr(class_name):
    rgb = CLASS_COLORS.get(class_name, (120, 120, 120))
    return (rgb[2], rgb[1], rgb[0]) # BGR for OpenCV

class AeroSightEngine:
    def __init__(self, weights_path=None):
        self.device = 0 if torch.cuda.is_available() else "cpu"
        self.active_model_name = "yolov8n-obb.pt"
        self.active_weights_path = None
        self.load_model(weights_path)

    def load_model(self, weights_path=None):
        if weights_path and Path(weights_path).exists():
            target_path = str(weights_path)
            self.active_model_name = Path(weights_path).name
        else:
            best_pt = Path("P:/Projects/AeroSight/ml/weights/best.pt")
            if best_pt.exists():
                target_path = str(best_pt)
                self.active_model_name = "best.pt"
            else:
                target_path = "yolov8n-obb.pt"
                self.active_model_name = "yolov8n-obb.pt"
        
        self.active_weights_path = target_path
        print(f"Loading YOLO-OBB model from: {target_path} on {self.device}")
        self.model = YOLO(target_path)
        return self.active_model_name

    def rotated_polygon_nms(self, detections, iou_threshold=0.35):
        if not detections:
            return []
        
        # Sort by confidence descending
        dets = sorted(detections, key=lambda x: x["confidence"], reverse=True)
        keep = []

        # Convert to shapely polygons
        shapely_polys = []
        for d in dets:
            pts = d["polygon"]
            try:
                poly = Polygon(pts)
                if not poly.is_valid:
                    poly = poly.buffer(0)
                shapely_polys.append(poly)
            except Exception:
                shapely_polys.append(None)

        suppressed = [False] * len(dets)

        for i in range(len(dets)):
            if suppressed[i]:
                continue
            keep.append(dets[i])
            poly_i = shapely_polys[i]
            if poly_i is None or poly_i.is_empty:
                continue

            for j in range(i + 1, len(dets)):
                if suppressed[j]:
                    continue
                # Only suppress same class
                if dets[i]["class"] != dets[j]["class"]:
                    continue

                poly_j = shapely_polys[j]
                if poly_j is None or poly_j.is_empty:
                    continue

                try:
                    inter_area = poly_i.intersection(poly_j).area
                    if inter_area > 0:
                        union_area = poly_i.union(poly_j).area
                        iou = inter_area / union_area if union_area > 0 else 0
                        if iou > iou_threshold:
                            suppressed[j] = True
                except Exception:
                    pass

        return keep

    def detect(self, img_input, conf=0.25, iou=0.45, class_filter=None, tile_size=1024, overlap=200):
        start_time = time.time()

        # Handle PIL Image or numpy array
        if isinstance(img_input, Image.Image):
            pil_img = img_input.convert("RGB")
            np_img = np.array(pil_img)
            bgr_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
        elif isinstance(img_input, np.ndarray):
            bgr_img = img_input.copy()
            np_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(np_img)
        else:
            raise ValueError("Unsupported image input type")

        img_h, img_w = bgr_img.shape[:2]
        all_detections = []

        # Determine tiling strategy
        if img_w <= 1280 and img_h <= 1280:
            # Single image inference
            results = self.model(bgr_img, conf=conf, iou=iou, device=self.device, verbose=False)
            all_detections = self._extract_detections(results[0], offset_x=0, offset_y=0)
        else:
            # Tiled inference with overlap
            stride = tile_size - overlap
            x_steps = list(range(0, max(1, img_w - tile_size + stride), stride))
            y_steps = list(range(0, max(1, img_h - tile_size + stride), stride))

            if x_steps[-1] + tile_size < img_w:
                x_steps.append(img_w - tile_size)
            if y_steps[-1] + tile_size < img_h:
                y_steps.append(img_h - tile_size)

            tiles = []
            offsets = []
            for y in y_steps:
                for x in x_steps:
                    x2 = min(x + tile_size, img_w)
                    y2 = min(y + tile_size, img_h)
                    tile = bgr_img[y:y2, x:x2]
                    # Pad if needed to 1024
                    th, tw = tile.shape[:2]
                    if th < tile_size or tw < tile_size:
                        padded = np.zeros((tile_size, tile_size, 3), dtype=np.uint8)
                        padded[:th, :tw] = tile
                        tile = padded
                    tiles.append(tile)
                    offsets.append((x, y))

            # Batch run tiles
            batch_size = 4
            for idx in range(0, len(tiles), batch_size):
                batch_tiles = tiles[idx:idx + batch_size]
                batch_offsets = offsets[idx:idx + batch_size]
                results = self.model(batch_tiles, conf=conf, iou=iou, device=self.device, verbose=False)
                for res, (ox, oy) in zip(results, batch_offsets):
                    dets = self._extract_detections(res, offset_x=ox, offset_y=oy)
                    all_detections.extend(dets)

            # Apply rotated polygon NMS across tile boundaries
            all_detections = self.rotated_polygon_nms(all_detections, iou_threshold=iou)

        # Filter classes if requested
        if class_filter:
            allowed = set(c.lower().strip() for c in class_filter)
            all_detections = [d for d in all_detections if d["class"].lower() in allowed]

        # Calculate counts
        counts = {}
        for d in all_detections:
            cls = d["class"]
            counts[cls] = counts.get(cls, 0) + 1

        latency_ms = round((time.time() - start_time) * 1000, 1)

        # Annotate image
        annotated_bgr = self.draw_annotations(bgr_img.copy(), all_detections)
        annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
        
        # Encode to Base64
        _, buffer = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        b64_str = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

        return {
            "total_detections": len(all_detections),
            "counts": counts,
            "latency_ms": latency_ms,
            "model_name": self.active_model_name,
            "detections": all_detections,
            "annotated_image_base64": b64_str,
            "annotated_image_bgr": annotated_bgr,
            "image_size": {"width": img_w, "height": img_h}
        }

    def _extract_detections(self, result, offset_x=0, offset_y=0):
        detections = []
        obb = getattr(result, "obb", None)
        if obb is None:
            return detections

        names = result.names
        # obb.xyxyxyxy returns polygons of shape (N, 4, 2)
        try:
            poly_tensor = obb.xyxyxyxy.cpu().numpy()
            conf_tensor = obb.conf.cpu().numpy()
            cls_tensor = obb.cls.cpu().numpy()
            
            for poly, conf_val, cls_idx in zip(poly_tensor, conf_tensor, cls_tensor):
                class_name = names.get(int(cls_idx), str(int(cls_idx)))
                # Offset coordinates
                shifted_poly = []
                for pt in poly:
                    shifted_poly.append([float(pt[0] + offset_x), float(pt[1] + offset_y)])

                detections.append({
                    "class": class_name,
                    "class_id": int(cls_idx),
                    "confidence": round(float(conf_val), 3),
                    "polygon": shifted_poly
                })
        except Exception as e:
            print(f"Error parsing OBB tensor: {e}")

        return detections

    def draw_annotations(self, img_bgr, detections):
        overlay = img_bgr.copy()
        h, w = img_bgr.shape[:2]
        line_thick = max(1, int(round(min(w, h) / 600)))
        font_scale = max(0.4, min(w, h) / 1400)

        for d in detections:
            cls_name = d["class"]
            conf = d["confidence"]
            pts = np.array(d["polygon"], dtype=np.int32)
            color = get_color_bgr(cls_name)

            # Fill translucent
            cv2.fillPoly(overlay, [pts], color)
            # Outline
            cv2.polylines(img_bgr, [pts], isClosed=True, color=color, thickness=line_thick, lineType=cv2.LINE_AA)

            # Draw label banner at top-most point
            top_pt = min(pts, key=lambda p: p[1])
            lx, ly = int(top_pt[0]), max(15, int(top_pt[1]) - 4)
            label = f"{cls_name} {int(conf*100)}%"

            (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)
            cv2.rectangle(img_bgr, (lx, ly - th - 4), (lx + tw + 4, ly + 2), color, -1)
            cv2.putText(img_bgr, label, (lx + 2, ly - 2), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), 1, cv2.LINE_AA)

        # Blend translucent fill
        cv2.addWeighted(overlay, 0.25, img_bgr, 0.75, 0, img_bgr)
        return img_bgr

# Singleton engine instance
engine = AeroSightEngine()
