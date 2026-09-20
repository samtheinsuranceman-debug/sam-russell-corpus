export type MatterStatus = 'drafting' | 'review' | 'filed' | 'office-action' | 'granted' | 'abandoned';
export type DeadlineStatus = 'open' | 'completed';
export type DeadlineClassification = 'overdue' | 'due_soon' | 'upcoming' | 'completed';

export type MatterRecord = {
  id: number;
  docket: string;
  application_number: string | null;
  title: string;
  client: string;
  status: MatterStatus;
  attorney: string;
  cpc: string | null;
  next_step: string | null;
  created_at: string;
  updated_at: string;
};

export type DeadlineRecord = {
  id: number;
  matter_id: number;
  docket: string;
  title: string;
  owner: string;
  due_date: string;
  is_statutory: boolean;
  status: DeadlineStatus;
  classification: DeadlineClassification;
  created_at: string;
  updated_at: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (res.status === 204) {
    return null as T;
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail ?? body?.error ?? body?.reason ?? `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return body as T;
}

export async function listMatters(): Promise<MatterRecord[]> {
  const body = await request<{ items: MatterRecord[] }>('/api/matters');
  return body.items;
}

export async function createMatter(input: Omit<MatterRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MatterRecord> {
  return request<MatterRecord>('/api/matters', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateMatter(
  id: number,
  input: Omit<MatterRecord, 'id' | 'created_at' | 'updated_at'>,
): Promise<MatterRecord> {
  return request<MatterRecord>(`/api/matters/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteMatter(id: number): Promise<void> {
  await request<unknown>(`/api/matters/${id}`, { method: 'DELETE' });
}

export async function listDeadlines(matterId?: number): Promise<DeadlineRecord[]> {
  const suffix = matterId ? `?matter_id=${matterId}` : '';
  const body = await request<{ items: DeadlineRecord[] }>(`/api/deadlines${suffix}`);
  return body.items;
}

export async function createDeadline(
  input: Omit<DeadlineRecord, 'id' | 'docket' | 'classification' | 'created_at' | 'updated_at'>,
): Promise<DeadlineRecord> {
  return request<DeadlineRecord>('/api/deadlines', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateDeadline(
  id: number,
  input: Omit<DeadlineRecord, 'id' | 'matter_id' | 'docket' | 'classification' | 'created_at' | 'updated_at'>,
): Promise<DeadlineRecord> {
  return request<DeadlineRecord>(`/api/deadlines/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteDeadline(id: number): Promise<void> {
  await request<unknown>(`/api/deadlines/${id}`, { method: 'DELETE' });
}
