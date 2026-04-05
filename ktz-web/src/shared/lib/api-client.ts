const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ktz_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token ?? null;
  } catch { return null; }
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export interface ApiRoute {
  id: number;
  origin: string;
  destination: string;
  status: string;
  userId: number | null;
  username: string | null;
  locomotiveId: number | null;
  locomotiveName: string | null;
  locomotiveNumber: string | null;
  stations: string | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  startLat: number | null;
  startLon: number | null;
  endLat: number | null;
  endLon: number | null;
  driverName: string | null;
  driverSurname: string | null;
  driverAge: number | null;
  driverPhotoUrl: string | null;
}

export interface ApiLocomotive {
  id: number;
  number: string;
  name: string;
  type: string;
}

export interface ApiDriver {
  id: number;
  name: string;
  surname: string;
  username: string;
  age: number;
  role: string;
  locomotiveId: number | null;
  photoUrl: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

export const routesApi = {
  getAll: () => get<ApiRoute[]>('/route'),
  getById: (id: number) => get<ApiRoute>(`/route/${id}`),
  create: (body: Partial<ApiRoute>) => post<ApiRoute>('/route', body),
  update: (id: number, body: Partial<ApiRoute>) => put<ApiRoute>(`/route/${id}`, body),
  delete: (id: number) => del(`/route/${id}`),
};

export const locomotivesApi = {
  getAll: () => get<ApiLocomotive[]>('/locomotive'),
  create: (body: Partial<ApiLocomotive>) => post<ApiLocomotive>('/locomotive', body),
  update: (id: number, body: Partial<ApiLocomotive>) => put<ApiLocomotive>(`/locomotive/${id}`, body),
  delete: (id: number) => del(`/locomotive/${id}`),
};

export const driversApi = {
  getAll: () => get<ApiDriver[]>('/user'),
  getById: (id: number) => get<ApiDriver>(`/user/${id}`),
  create: async (data: {
    name: string; surname: string; username: string; age: number;
    password: string; role: string; locomotiveId?: number | null;
  }, photoFile?: File): Promise<ApiDriver> => {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (photoFile) form.append('photo', photoFile);
    const res = await fetch(`${API}/user/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST /user/create → ${res.status}: ${text}`);
    }
    return res.json();
  },
  update: async (id: number, data: Partial<{
    name: string; surname: string; username: string; age: number;
    password: string; role: string; locomotiveId: number | null;
  }>, photoFile?: File): Promise<ApiDriver> => {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (photoFile) form.append('photo', photoFile);
    const res = await fetch(`${API}/user/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PUT /user/${id} → ${res.status}: ${text}`);
    }
    return res.json();
  },
  delete: (id: number) => del(`/user/${id}`),
};
