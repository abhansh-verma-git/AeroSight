import base64
import cv2
import numpy as np
from PIL import Image
from shapely.geometry import Polygon
from inference import engine, get_color_bgr

def compute_polygon_iou(poly1_pts, poly2_pts):
    try:
        p1 = Polygon(poly1_pts)
        p2 = Polygon(poly2_pts)
        if not p1.is_valid:
            p1 = p1.buffer(0)
        if not p2.is_valid:
            p2 = p2.buffer(0)
        inter = p1.intersection(p2).area
        union = p1.union(p2).area
        return inter / union if union > 0 else 0.0
    except Exception:
        return 0.0

def center_distance(poly1_pts, poly2_pts):
    c1 = np.mean(poly1_pts, axis=0)
    c2 = np.mean(poly2_pts, axis=0)
    return np.linalg.norm(c1 - c2)

def perform_change_detection(img_before_input, img_after_input, conf=0.25, iou_match_thresh=0.30, dist_thresh=45.0):
    # Run detections on both images
    res_before = engine.detect(img_before_input, conf=conf)
    res_after = engine.detect(img_after_input, conf=conf)

    dets_before = res_before["detections"]
    dets_after = res_after["detections"]

    matched_before = set()
    matched_after = set()

    # Match detections by class and spatial IoU / distance
    for i, db in enumerate(dets_before):
        best_j = -1
        best_score = 0
        for j, da in enumerate(dets_after):
            if j in matched_after:
                continue
            if db["class"] != da["class"]:
                continue
            
            iou_score = compute_polygon_iou(db["polygon"], da["polygon"])
            dist = center_distance(db["polygon"], da["polygon"])
            
            if iou_score > iou_match_thresh or dist < dist_thresh:
                score = iou_score if iou_score > 0 else (1.0 / (1.0 + dist))
                if score > best_score:
                    best_score = score
                    best_j = j

        if best_j != -1:
            matched_before.add(i)
            matched_after.add(best_j)

    # Categorize changes
    unchanged_before = [dets_before[i] for i in matched_before]
    unchanged_after = [dets_after[j] for j in matched_after]
    
    missing_objects = [dets_before[i] for i in range(len(dets_before)) if i not in matched_before]
    new_objects = [dets_after[j] for j in range(len(dets_after)) if j not in matched_after]

    # Compute per-class delta statistics
    all_classes = set(list(res_before["counts"].keys()) + list(res_after["counts"].keys()))
    class_deltas = {}
    for cls in sorted(all_classes):
        cnt_before = res_before["counts"].get(cls, 0)
        cnt_after = res_after["counts"].get(cls, 0)
        diff = cnt_after - cnt_before
        class_deltas[cls] = {
            "before": cnt_before,
            "after": cnt_after,
            "delta": diff,
            "status": "increased" if diff > 0 else ("decreased" if diff < 0 else "unchanged")
        }

    # Annotate comparison visualization on 'after' image
    after_bgr = cv2.cvtColor(np.array(img_after_input.convert("RGB")), cv2.COLOR_RGB2BGR)
    overlay = after_bgr.copy()
    
    # 1. Draw unchanged in subtle gray
    for d in unchanged_after:
        pts = np.array(d["polygon"], dtype=np.int32)
        cv2.polylines(after_bgr, [pts], isClosed=True, color=(160, 160, 160), thickness=2, lineType=cv2.LINE_AA)

    # 2. Draw missing objects (ghost polygon in RED from before image)
    for d in missing_objects:
        pts = np.array(d["polygon"], dtype=np.int32)
        red = (0, 0, 240)
        cv2.fillPoly(overlay, [pts], red)
        cv2.polylines(after_bgr, [pts], isClosed=True, color=red, thickness=3, lineType=cv2.LINE_AA)
        
        # Tag "MISSING"
        top_pt = min(pts, key=lambda p: p[1])
        cv2.putText(after_bgr, f"MISSING: {d['class']}", (int(top_pt[0]), max(15, int(top_pt[1]) - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, red, 1, cv2.LINE_AA)

    # 3. Draw new objects in NEON GREEN
    for d in new_objects:
        pts = np.array(d["polygon"], dtype=np.int32)
        green = (20, 225, 20)
        cv2.fillPoly(overlay, [pts], green)
        cv2.polylines(after_bgr, [pts], isClosed=True, color=green, thickness=3, lineType=cv2.LINE_AA)
        
        # Tag "NEW"
        top_pt = min(pts, key=lambda p: p[1])
        cv2.putText(after_bgr, f"NEW: {d['class']}", (int(top_pt[0]), max(15, int(top_pt[1]) - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, green, 1, cv2.LINE_AA)

    cv2.addWeighted(overlay, 0.3, after_bgr, 0.7, 0, after_bgr)

    # Encode to Base64
    _, buffer = cv2.imencode(".jpg", after_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    b64_annotated = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

    return {
        "summary": {
            "total_before": len(dets_before),
            "total_after": len(dets_after),
            "new_count": len(new_objects),
            "missing_count": len(missing_objects),
            "unchanged_count": len(unchanged_after)
        },
        "class_deltas": class_deltas,
        "new_objects": new_objects,
        "missing_objects": missing_objects,
        "annotated_comparison_base64": b64_annotated,
        "before_annotated_base64": res_before["annotated_image_base64"],
        "after_annotated_base64": res_after["annotated_image_base64"],
        "latency_ms": round(res_before["latency_ms"] + res_after["latency_ms"], 1)
    }
