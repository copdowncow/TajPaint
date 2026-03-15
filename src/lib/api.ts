export async function apiCall(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  // Public
  createBooking: (body: unknown) =>
    apiCall('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getSlots: (date: string) => apiCall(`/api/slots?date=${date}`),
  getPricing: () => apiCall('/api/pricing'),

  // Auth
  login: (login: string, password: string) =>
    apiCall('/api/auth', { method: 'POST', body: JSON.stringify({ login, password }) }),
  getMe: () => apiCall('/api/auth'),

  // Admin — bookings
  getBookings: (params?: Record<string, string>) =>
    apiCall(`/api/admin/bookings${params ? '?' + new URLSearchParams(params) : ''}`),
  getBooking: (id: string) => apiCall(`/api/admin/bookings/${id}`),
  updateBookingStatus: (id: string, status: string, admin_comment?: string) =>
    apiCall(`/api/admin/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, admin_comment }) }),
  updatePrepayment: (id: string, prepayment_status: string) =>
    apiCall(`/api/admin/bookings/${id}/prepayment`, { method: 'PATCH', body: JSON.stringify({ prepayment_status }) }),
  updateBooking: (id: string, data: unknown) =>
    apiCall(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Admin — history & stats
  getHistory: (params?: Record<string, string>) =>
    apiCall(`/api/admin/history${params ? '?' + new URLSearchParams(params) : ''}`),
  getStats: () => apiCall('/api/admin/stats'),

  // Admin — pricing
  getAllPricing: () => apiCall('/api/pricing?all=1'),
  createPricing: (data: unknown) =>
    apiCall('/api/pricing', { method: 'POST', body: JSON.stringify(data) }),
  updatePricing: (id: string, data: unknown) =>
    apiCall(`/api/pricing?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePricing: (id: string) => apiCall(`/api/pricing?id=${id}`, { method: 'DELETE' }),

  // Admin — settings
  getSettings: () => apiCall('/api/pricing?settings=1'),
  updateSetting: (key: string, value: string) =>
    apiCall(`/api/pricing?settings=1&key=${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
};
