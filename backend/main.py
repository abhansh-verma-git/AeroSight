import os
import sys
import json
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image
import pandas as pd
import io

# Local modules
sys.path.insert(0, str(Path(__file__).parent))
import database as db
from inference import engine, DOTA_CLASSES
from change_detection import perform_change_detection

app = FastAPI(
    title="AeroSight API",
    description="Aerial Object Detection & Surveillance Dashboard API using YOLO-OBB on DOTA",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path("P:/Projects/AeroSight/backend/static")
STATIC_RUNS_DIR = STATIC_DIR / "runs"
SAMPLES_DIR = Path("P:/Projects/AeroSight/backend/samples")
STATIC_RUNS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def prepare_samples():
    """Ensure sample images exist in backend/samples for instant live demo."""
    val_img_dir = Path("P:/Projects/AeroSight/DOTAv1/DOTAv1/images/val")
    if not val_img_dir.exists():
        return
    
    sample_candidates = ["P0003.jpg", "P0004.jpg", "P0007.jpg", "P0019.jpg", "P0027.jpg", "P0053.jpg", "P0060.jpg"]
    for sc in sample_candidates:
        src = val_img_dir / sc
        dst = SAMPLES_DIR / sc
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)

prepare_samples()

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "model": engine.active_model_name,
        "device": engine.device
    }

@app.post("/api/detect")
async def detect_objects(
    file: Optional[UploadFile] = File(None),
    sample_filename: Optional[str] = Form(None),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    classes: Optional[str] = Form(None) # Comma-separated list
):
    try:
        # Load image either from upload or sample
        filename = "uploaded_image.jpg"
        if file is not None and file.filename:
            filename = file.filename
            contents = await file.read()
            pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        elif sample_filename:
            sample_path = SAMPLES_DIR / sample_filename
            if not sample_path.exists():
                val_path = Path("P:/Projects/AeroSight/DOTAv1/DOTAv1/images/val") / sample_filename
                if val_path.exists():
                    sample_path = val_path
            if not sample_path.exists():
                raise HTTPException(status_code=404, detail="Sample image not found")
            filename = sample_filename
            pil_img = Image.open(sample_path).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail="Either an image file or sample_filename must be provided.")

        class_filter = [c.strip() for c in classes.split(",") if c.strip()] if classes else None
        
        # Run inference
        result = engine.detect(pil_img, conf=conf, iou=iou, class_filter=class_filter)
        
        # Save annotated image for persistent history
        run_img_name = f"run_{int(time.time()*1000)}_{filename}"
        run_img_path = STATIC_RUNS_DIR / run_img_name
        import cv2
        cv2.imwrite(str(run_img_path), result["annotated_image_bgr"])
        annotated_url = f"/static/runs/{run_img_name}"

        # Alert Generation based on real detections
        alert_triggered = False
        counts = result["counts"]
        total = result["total_detections"]
        latency = result["latency_ms"]

        # Alert Rule 1: High vehicle or ship density
        ship_count = counts.get("ship", 0)
        plane_count = counts.get("plane", 0)
        vehicle_count = counts.get("small-vehicle", 0) + counts.get("large-vehicle", 0)

        alert_id = None
        if ship_count >= 8:
            alert_id = db.insert_alert("Critical", "High Maritime Density", f"Surveillance detected {ship_count} ships in single aerial frame {filename}.")
            alert_triggered = True
        elif plane_count >= 5:
            alert_id = db.insert_alert("Warning", "Airfield Congestion", f"Detected {plane_count} aircraft on tarmac in {filename}.")
            alert_triggered = True
        elif vehicle_count >= 20:
            alert_id = db.insert_alert("Warning", "Heavy Ground Traffic", f"High concentration of {vehicle_count} vehicles detected in {filename}.")
            alert_triggered = True
        elif latency > 2500:
            alert_id = db.insert_alert("Warning", "High Latency Warning", f"Tiled inference took {latency}ms for high-resolution scene.")
            alert_triggered = True
        elif total > 0:
            avg_conf = sum(d["confidence"] for d in result["detections"]) / total
            if avg_conf < 0.40:
                alert_id = db.insert_alert("Info", "Low Confidence Observation", f"Average detection confidence is {avg_conf:.2f} under adverse illumination.")
                alert_triggered = True

        status = "Alert Triggered" if alert_triggered else "Completed"
        run_id = db.insert_run(
            filename=filename,
            counts=counts,
            total_detections=total,
            latency_ms=latency,
            model_name=engine.active_model_name,
            annotated_image_path=annotated_url,
            status=status
        )

        return {
            "run_id": run_id,
            "filename": filename,
            "total_detections": total,
            "counts": counts,
            "latency_ms": latency,
            "model_name": engine.active_model_name,
            "annotated_image_base64": result["annotated_image_base64"],
            "annotated_image_url": annotated_url,
            "detections": result["detections"],
            "alert_triggered": alert_triggered
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/change-detection")
async def change_detection(
    before_file: Optional[UploadFile] = File(None),
    after_file: Optional[UploadFile] = File(None),
    sample_before: Optional[str] = Form(None),
    sample_after: Optional[str] = Form(None),
    conf: float = Form(0.25)
):
    try:
        # Load before image
        if before_file:
            contents = await before_file.read()
            img_before = Image.open(io.BytesIO(contents)).convert("RGB")
        elif sample_before:
            p = SAMPLES_DIR / sample_before
            if not p.exists():
                p = Path("P:/Projects/AeroSight/DOTAv1/DOTAv1/images/val") / sample_before
            img_before = Image.open(p).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail="Missing Before image")

        # Load after image
        if after_file:
            contents = await after_file.read()
            img_after = Image.open(io.BytesIO(contents)).convert("RGB")
        elif sample_after:
            p = SAMPLES_DIR / sample_after
            if not p.exists():
                p = Path("P:/Projects/AeroSight/DOTAv1/DOTAv1/images/val") / sample_after
            img_after = Image.open(p).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail="Missing After image")

        result = perform_change_detection(img_before, img_after, conf=conf)
        
        # Log to alerts if significant changes
        new_cnt = result["summary"]["new_count"]
        missing_cnt = result["summary"]["missing_count"]
        if new_cnt > 0 or missing_cnt > 0:
            db.insert_alert(
                severity="Info",
                title="Activity Shift Detected",
                message=f"Change detection revealed +{new_cnt} new objects and -{missing_cnt} missing assets."
            )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
def get_metrics():
    metrics_path = Path("P:/Projects/AeroSight/ml/runs/metrics.json")
    train_csv_path = Path("P:/Projects/AeroSight/ml/runs/train/results.csv")
    if not train_csv_path.exists():
        train_csv_path = Path("P:/Projects/AeroSight/ml/runs/results.csv")

    metrics_data = {}
    if metrics_path.exists():
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                metrics_data = json.load(f)
        except Exception as e:
            print(f"Error reading metrics.json: {e}")
    else:
        # Fallback state if model training has not concluded yet
        metrics_data = {
            "status": "no_trained_model",
            "is_trained": False,
            "model_name": engine.active_model_name,
            "weights_path": engine.active_weights_path,
            "mAP50": 0.0,
            "mAP50_95": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "fps": 34.5,
            "latency_ms": 29.0,
            "per_class_ap": {},
            "classes": DOTA_CLASSES,
            "has_confusion_matrix": False,
            "has_training_curves": False
        }

    # Parse real training curves from results.csv if it exists
    curves = []
    if train_csv_path.exists():
        try:
            df = pd.read_csv(train_csv_path)
            df.columns = [c.strip() for c in df.columns]
            for _, row in df.iterrows():
                curves.append({
                    "epoch": int(row.get("epoch", 0)),
                    "train_loss": round(float(row.get("train/box_loss", 0.0) + row.get("train/cls_loss", 0.0)), 4),
                    "val_loss": round(float(row.get("val/box_loss", 0.0) + row.get("val/cls_loss", 0.0)), 4),
                    "mAP50": round(float(row.get("metrics/mAP50(B)", 0.0)), 4),
                    "mAP50_95": round(float(row.get("metrics/mAP50-95(B)", 0.0)), 4)
                })
        except Exception as e:
            print(f"Error parsing results.csv: {e}")

    metrics_data["training_curves"] = curves
    return metrics_data

@app.get("/api/history")
def get_history(limit: int = 25):
    runs = db.get_recent_runs(limit=limit)
    summary = db.get_stats_summary()
    return {
        "runs": runs,
        "summary": summary
    }

@app.get("/api/alerts")
def get_alerts(limit: int = 20):
    return db.get_alerts(limit=limit)

@app.get("/api/models")
def get_models():
    weights_dir = Path("P:/Projects/AeroSight/ml/weights")
    models = []
    
    # 1. Custom best.pt
    best_pt = weights_dir / "best.pt"
    if best_pt.exists():
        models.append({
            "name": "best.pt",
            "type": "Custom Trained YOLO-OBB",
            "path": str(best_pt),
            "size_mb": round(best_pt.stat().st_size / (1024 * 1024), 2),
            "is_active": engine.active_model_name == "best.pt"
        })

    # 2. Pretrained fallbacks
    models.append({
        "name": "yolov8n-obb.pt",
        "type": "Ultralytics YOLOv8 Nano OBB (DOTA Pretrained)",
        "path": "yolov8n-obb.pt",
        "size_mb": 6.8,
        "is_active": engine.active_model_name == "yolov8n-obb.pt"
    })
    models.append({
        "name": "yolov8s-obb.pt",
        "type": "Ultralytics YOLOv8 Small OBB (DOTA Pretrained)",
        "path": "yolov8s-obb.pt",
        "size_mb": 22.8,
        "is_active": engine.active_model_name == "yolov8s-obb.pt"
    })

    return {
        "active_model": engine.active_model_name,
        "models": models
    }

@app.post("/api/models/select")
def select_model(model_name: str = Query(...)):
    new_model = engine.load_model(model_name)
    return {
        "status": "success",
        "active_model": new_model
    }

@app.get("/api/samples")
def list_samples():
    prepare_samples()
    samples = []
    if SAMPLES_DIR.exists():
        for f in SAMPLES_DIR.iterdir():
            if f.suffix.lower() in [".jpg", ".png"]:
                samples.append({
                    "filename": f.name,
                    "url": f"/api/samples/{f.name}",
                    "size_kb": round(f.stat().st_size / 1024, 1)
                })
    return samples

@app.get("/api/samples/{filename}")
def get_sample_file(filename: str):
    p = SAMPLES_DIR / filename
    if not p.exists():
        p = Path("P:/Projects/AeroSight/DOTAv1/DOTAv1/images/val") / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail="Sample not found")
    return FileResponse(str(p))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
