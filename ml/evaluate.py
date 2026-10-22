import os
import sys
import json
import shutil
import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

def detect_device(requested_device=None):
    if requested_device:
        return requested_device
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

def evaluate_model(
    weights_path=None,
    data="P:/Projects/AeroSight/ml/data.yaml",
    imgsz=1024,
    device=None,
    project="P:/Projects/AeroSight/ml/runs",
    name="val",
    split="val"
):
    device = detect_device(device)
    runs_dir = Path(project)
    runs_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine weights to use
    is_trained = False
    if weights_path and Path(weights_path).exists():
        actual_weights = weights_path
        is_trained = "best.pt" in str(weights_path) or "train" in str(weights_path)
    else:
        best_pt = Path("P:/Projects/AeroSight/ml/weights/best.pt")
        if best_pt.exists():
            actual_weights = str(best_pt)
            is_trained = True
        else:
            actual_weights = "yolov8n-obb.pt"
            is_trained = False
            print("No custom trained weights found at /ml/weights/best.pt. Using pretrained fallback yolov8n-obb.pt.")

    print(f"==================================================")
    print(f" AeroSight YOLO-OBB Evaluation")
    print(f" Model Weights: {actual_weights} (Custom trained: {is_trained})")
    print(f" Dataset YAML: {data}")
    print(f" Split: {split} | Imgsz: {imgsz} | Device: {device}")
    print(f"==================================================")

    model = YOLO(actual_weights)

    val_res = model.val(
        data=data,
        imgsz=imgsz,
        device=device,
        split=split,
        project=project,
        name=name,
        exist_ok=True,
        plots=True,
        verbose=True
    )

    save_dir = Path(val_res.save_dir) if hasattr(val_res, "save_dir") else runs_dir / name

    # Extract metrics safely from results_dict or obb/box metrics
    res_dict = getattr(val_res, "results_dict", {})
    
    # Map metrics
    map50 = res_dict.get("metrics/mAP50(B)", 0.0)
    map50_95 = res_dict.get("metrics/mAP50-95(B)", 0.0)
    precision = res_dict.get("metrics/precision(B)", 0.0)
    recall = res_dict.get("metrics/recall(B)", 0.0)

    # Class names and per-class AP
    names = getattr(model, "names", {})
    if not names and hasattr(val_res, "names"):
        names = val_res.names

    per_class_ap = {}
    metric_box = getattr(val_res, "obb", getattr(val_res, "box", None))
    if metric_box and hasattr(metric_box, "maps") and metric_box.maps is not None:
        maps = metric_box.maps
        for idx, ap in enumerate(maps):
            cls_name = names.get(idx, f"class_{idx}")
            per_class_ap[cls_name] = round(float(ap), 4)

    # Calculate speeds and FPS
    speed_info = getattr(val_res, "speed", {})
    inference_ms = speed_info.get("inference", 0.0)
    preprocess_ms = speed_info.get("preprocess", 0.0)
    postprocess_ms = speed_info.get("postprocess", 0.0)
    total_ms = preprocess_ms + inference_ms + postprocess_ms
    fps = round(1000.0 / total_ms, 1) if total_ms > 0 else 0.0

    # Locate confusion matrix & results curve if present
    cm_path = save_dir / "confusion_matrix.png"
    cm_norm_path = save_dir / "confusion_matrix_normalized.png"
    
    # Check for results.csv in train run or evaluate run
    train_results_csv = runs_dir / "train" / "results.csv"
    eval_results_csv = save_dir / "results.csv"
    target_results_csv = runs_dir / "results.csv"
    if train_results_csv.exists() and not target_results_csv.exists():
        shutil.copy2(train_results_csv, target_results_csv)
    elif eval_results_csv.exists() and not target_results_csv.exists():
        shutil.copy2(eval_results_csv, target_results_csv)

    output_metrics = {
        "status": "success",
        "is_trained": is_trained,
        "weights_path": str(actual_weights),
        "model_name": Path(actual_weights).name,
        "mAP50": round(float(map50), 4),
        "mAP50_95": round(float(map50_95), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "fps": fps,
        "latency_ms": round(float(total_ms), 2),
        "inference_ms": round(float(inference_ms), 2),
        "per_class_ap": per_class_ap,
        "classes": list(names.values()) if names else [],
        "has_confusion_matrix": cm_norm_path.exists() or cm_path.exists(),
        "has_training_curves": target_results_csv.exists() or train_results_csv.exists()
    }

    # Save metrics JSON
    metrics_json_path = runs_dir / "metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(output_metrics, f, indent=2)
    print(f"Saved real evaluation metrics to: {metrics_json_path}")
    print(json.dumps(output_metrics, indent=2))

    return output_metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate AeroSight YOLO-OBB Model")
    parser.add_argument("--weights", type=str, default=None)
    parser.add_argument("--data", type=str, default="P:/Projects/AeroSight/ml/data.yaml")
    parser.add_argument("--imgsz", type=int, default=1024)
    parser.add_argument("--device", type=str, default=None)
    args = parser.parse_args()

    evaluate_model(
        weights_path=args.weights,
        data=args.data,
        imgsz=args.imgsz,
        device=args.device
    )
