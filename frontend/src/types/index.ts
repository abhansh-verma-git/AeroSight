export interface Detection {
  class: string;
  class_id: number;
  confidence: number;
  polygon: number[][]; // [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
}

export interface DetectionResult {
  run_id: number;
  filename: string;
  total_detections: number;
  counts: Record<string, number>;
  latency_ms: number;
  model_name: string;
  annotated_image_base64: string;
  annotated_image_url?: string;
  detections: Detection[];
  alert_triggered: boolean;
}

export interface ChangeDetectionResult {
  summary: {
    total_before: number;
    total_after: number;
    new_count: number;
    missing_count: number;
    unchanged_count: number;
  };
  class_deltas: Record<string, {
    before: number;
    after: number;
    delta: number;
    status: 'increased' | 'decreased' | 'unchanged';
  }>;
  new_objects: Detection[];
  missing_objects: Detection[];
  annotated_comparison_base64: string;
  before_annotated_base64: string;
  after_annotated_base64: string;
  latency_ms: number;
}

export interface EvaluationMetrics {
  status: string;
  is_trained: boolean;
  weights_path: string;
  model_name: string;
  mAP50: number;
  mAP50_95: number;
  precision: number;
  recall: number;
  fps: number;
  latency_ms: number;
  inference_ms: number;
  per_class_ap: Record<string, number>;
  classes: string[];
  has_confusion_matrix: boolean;
  has_training_curves: boolean;
  training_curves?: Array<{
    epoch: number;
    train_loss: number;
    val_loss: number;
    mAP50: number;
    mAP50_95: number;
  }>;
}

export interface RunHistoryItem {
  id: number;
  timestamp: string;
  filename: string;
  total_detections: number;
  counts: Record<string, number>;
  latency_ms: number;
  model_name: string;
  status: string;
  annotated_image_path?: string;
}

export interface SystemAlert {
  id: number;
  run_id?: number;
  timestamp: string;
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  message: string;
}

export interface SampleItem {
  filename: string;
  url: string;
  size_kb: number;
}

export interface ModelItem {
  name: string;
  type: string;
  path: string;
  size_mb: number;
  is_active: boolean;
}
