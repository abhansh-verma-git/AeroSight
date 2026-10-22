import {
  DetectionResult,
  ChangeDetectionResult,
  EvaluationMetrics,
  RunHistoryItem,
  SystemAlert,
  SampleItem,
  ModelItem
} from '../types';

const API_BASE = '/api';

export async function detectObjects(formData: FormData): Promise<DetectionResult> {
  const res = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Detection failed' }));
    throw new Error(err.detail || 'Detection failed');
  }
  return res.json();
}

export async function runChangeDetection(formData: FormData): Promise<ChangeDetectionResult> {
  const res = await fetch(`${API_BASE}/change-detection`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Change detection failed' }));
    throw new Error(err.detail || 'Change detection failed');
  }
  return res.json();
}

export async function getMetrics(): Promise<EvaluationMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) {
    throw new Error('Failed to fetch metrics');
  }
  return res.json();
}

export async function getHistory(limit = 25): Promise<{ runs: RunHistoryItem[]; summary: any }> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch history');
  }
  return res.json();
}

export async function getAlerts(limit = 20): Promise<SystemAlert[]> {
  const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return res.json();
}

export async function getModels(): Promise<{ active_model: string; models: ModelItem[] }> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) {
    throw new Error('Failed to fetch models');
  }
  return res.json();
}

export async function selectModel(modelName: string): Promise<{ status: string; active_model: string }> {
  const res = await fetch(`${API_BASE}/models/select?model_name=${encodeURIComponent(modelName)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to select model');
  }
  return res.json();
}

export async function getSamples(): Promise<SampleItem[]> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) {
    throw new Error('Failed to fetch samples');
  }
  return res.json();
}
