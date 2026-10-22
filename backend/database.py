import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path("P:/Projects/AeroSight/backend/aerosight.db")

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        filename TEXT NOT NULL,
        total_detections INTEGER NOT NULL,
        counts_json TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        model_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Completed',
        annotated_image_path TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL, -- 'Critical', 'Warning', 'Info'
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES runs (id)
    )
    """)

    conn.commit()
    conn.close()

def insert_run(filename, counts, total_detections, latency_ms, model_name, annotated_image_path=None, status="Completed"):
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    counts_json = json.dumps(counts)

    cursor.execute("""
    INSERT INTO runs (timestamp, filename, total_detections, counts_json, latency_ms, model_name, status, annotated_image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (timestamp, filename, total_detections, counts_json, latency_ms, model_name, status, annotated_image_path))
    
    run_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return run_id

def insert_alert(severity, title, message, run_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO alerts (run_id, timestamp, severity, title, message)
    VALUES (?, ?, ?, ?, ?)
    """, (run_id, timestamp, severity, title, message))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def get_recent_runs(limit=20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "filename": r["filename"],
            "total_detections": r["total_detections"],
            "counts": json.loads(r["counts_json"]),
            "latency_ms": r["latency_ms"],
            "model_name": r["model_name"],
            "status": r["status"],
            "annotated_image_path": r["annotated_image_path"]
        })
    conn.close()
    return result

def get_alerts(limit=20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "run_id": r["run_id"],
            "timestamp": r["timestamp"],
            "severity": r["severity"],
            "title": r["title"],
            "message": r["message"]
        })
    conn.close()
    return result

def get_stats_summary():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*), SUM(total_detections), AVG(latency_ms) FROM runs")
    count, total_dets, avg_latency = cursor.fetchone()
    
    count = count or 0
    total_dets = total_dets or 0
    avg_latency = round(avg_latency, 1) if avg_latency else 0.0

    cursor.execute("SELECT counts_json FROM runs")
    all_runs = cursor.fetchall()
    class_totals = {}
    for r in all_runs:
        c = json.loads(r["counts_json"])
        for k, v in c.items():
            class_totals[k] = class_totals.get(k, 0) + v

    conn.close()
    return {
        "images_processed": count,
        "objects_detected": total_dets,
        "avg_latency_ms": avg_latency,
        "class_totals": class_totals
    }

init_db()
