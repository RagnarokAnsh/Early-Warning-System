const BASE = '/api';

export async function fetchSurface() {
  const res = await fetch(`${BASE}/surface`);
  if (!res.ok) throw new Error(`Surface API error: ${res.status}`);
  return res.json();
}

export async function predictSingle(payload) {
  const res = await fetch(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Predict API error: ${res.status}`);
  return res.json();
}

export async function bulkUpload(file, threshold = 0.5) {
  const form = new FormData();
  form.append('file', file);
  form.append('threshold', threshold.toString());
  const res = await fetch(`${BASE}/bulk`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Bulk API error: ${res.status}`);
  }
  return res.json();
}
