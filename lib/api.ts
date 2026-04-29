const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
  'Content-Type': 'application/json',
});

export const getTasks = () =>
  fetch(`${BASE}/api/tasks`, { headers: authHeader() }).then(r => r.json());

export const createTask = (data: any) =>
  fetch(`${BASE}/api/tasks`, {
    method: 'POST', headers: authHeader(), body: JSON.stringify(data),
  }).then(r => r.json());

export const updateTask = (id: string, data: any) =>
  fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PATCH', headers: authHeader(), body: JSON.stringify(data),
  }).then(r => r.json());

export const deleteTask = (id: string) =>
  fetch(`${BASE}/api/tasks/${id}`, {
    method: 'DELETE', headers: authHeader(),
  }).then(r => r.json());

export const loginUser = (data: any) =>
  fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const registerUser = (data: any) =>
  fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());
