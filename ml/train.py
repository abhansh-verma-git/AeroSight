import os
import sys
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

def train(
    data="P:/Projects/AeroSight/ml/data.yaml",
    model_name="yolov8n-obb.pt",
    epochs=1,
    batch=2,
    imgsz=1024,
    device=None,
    workers=2,
    project="P:/Projects/AeroSight/ml/runs",
    name="train"
):
    device = detect_device(device)
    print(f"==================================================")
    print(f" AeroSight YOLO-OBB Training Pipeline")
    print(f" Dataset: {data}")
    print(f" Base Model: {model_name}")
    print(f" Epochs: {epochs} | Batch: {batch} | Imgsz: {imgsz}")
    print(f" Device: {device} ({'GPU' if device != 'cpu' else 'CPU'})")
    print(f"==================================================")

    # Initialize model
    model = YOLO(model_name)

    # Train model
    results = model.train(
        data=data,
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        workers=workers,
        project=project,
        name=name,
        exist_ok=True,
        save=True,
        save_period=1,
        val=True,
        plots=True,
        verbose=True
    )

    # Paths
    run_dir = Path(project) / name
    weights_dir = Path("P:/Projects/AeroSight/ml/weights")
    weights_dir.mkdir(parents=True, exist_ok=True)
    
    best_weights_src = run_dir / "weights" / "best.pt"
    if not best_weights_src.exists():
        best_weights_src = run_dir / "weights" / "last.pt"
        
    best_weights_dst = weights_dir / "best.pt"
    if best_weights_src.exists():
        shutil.copy2(best_weights_src, best_weights_dst)
        print(f"Saved best model weights to: {best_weights_dst}")
    else:
        print("Warning: No weights file was generated in the run directory.")

    # Also run evaluate on best weights to generate metrics.json
    try:
        from evaluate import evaluate_model
        weights_to_eval = str(best_weights_dst) if best_weights_dst.exists() else model_name
        evaluate_model(weights_path=weights_to_eval, data=data, imgsz=imgsz, device=device)
    except Exception as e:
        print(f"Evaluation post-train notice: {e}")

    print("Training stage completed successfully.")
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AeroSight YOLO-OBB Training")
    parser.add_argument("--data", type=str, default="P:/Projects/AeroSight/ml/data.yaml")
    parser.add_argument("--model", type=str, default="yolov8n-obb.pt")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch", type=int, default=2)
    parser.add_argument("--imgsz", type=int, default=1024)
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()

    train(
        data=args.data,
        model_name=args.model,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        workers=args.workers
    )
