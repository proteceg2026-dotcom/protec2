// Dynamic Server URL & API Service Handler

const DEFAULT_SERVER_URL = 'http://localhost:5000';

export function getServerUrl() {
  return localStorage.getItem('protec_server_url') || DEFAULT_SERVER_URL;
}

export function setServerUrl(url) {
  let formattedUrl = url.trim();
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'http://' + formattedUrl;
  }
  localStorage.setItem('protec_server_url', formattedUrl);
  return formattedUrl;
}

export function getToken() {
  return localStorage.getItem('protec_auth_token') || '';
}

export function setToken(token) {
  localStorage.setItem('protec_auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('protec_auth_token');
  localStorage.removeItem('protec_user_profile');
}

// Universal fetch helper
async function request(endpoint, options = {}) {
  const baseUrl = getServerUrl();
  const token = getToken();

  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'حدث خطأ في الاتصال بالخادم');
    }
    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error(`تعذر الاتصال بالسيرفر على العنوان (${baseUrl}). يرجى التأكد من تشغيل السيرفر ورابط الاتصال.`);
    }
    throw err;
  }
}

// API methods
export const api = {
  // Test Server connection
  ping: async (customUrl) => {
    const targetUrl = customUrl || getServerUrl();
    const res = await fetch(`${targetUrl}/api/auth/ping`);
    return await res.json();
  },

  // Auth
  login: async (username, password) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('protec_user_profile', JSON.stringify(data.user));
    }
    return data;
  },

  getProfile: async () => {
    return await request('/api/auth/me');
  },

  // User Management (Admin)
  getUsers: async () => request('/api/users'),
  createUser: async (userData) => request('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: async (id, userData) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: async (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  // Products & Price Lists
  getProducts: async (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return request(`/api/products?${params.toString()}`);
  },
  getProductByCode: async (code) => request(`/api/products/code/${code}`),
  createProduct: async (productData) => request('/api/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: async (id, productData) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
  deleteProduct: async (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  
  uploadPriceList: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/products/upload-pricelist', {
      method: 'POST',
      body: formData
    });
  },

  // Quotations
  getQuotes: async (status = '', customer_id = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (customer_id) params.append('customer_id', customer_id);
    return request(`/api/quotes?${params.toString()}`);
  },
  getQuoteById: async (id) => request(`/api/quotes/${id}`),
  createQuote: async (quoteData) => request('/api/quotes', { method: 'POST', body: JSON.stringify(quoteData) }),
  updateQuoteStatus: async (id, status, notes = '') => request(`/api/quotes/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  deleteQuote: async (id) => request(`/api/quotes/${id}`, { method: 'DELETE' }),

  // CRM
  getCustomers: async (search = '', status = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return request(`/api/crm?${params.toString()}`);
  },
  getCustomerById: async (id) => request(`/api/crm/${id}`),
  createCustomer: async (customerData) => request('/api/crm', { method: 'POST', body: JSON.stringify(customerData) }),
  updateCustomer: async (id, customerData) => request(`/api/crm/${id}`, { method: 'PUT', body: JSON.stringify(customerData) }),
  deleteCustomer: async (id) => request(`/api/crm/${id}`, { method: 'DELETE' }),

  // AI Assistant
  aiChat: async (message) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) })
};
