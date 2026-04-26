import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status;
    const accountStatus = error.response?.data?.account_status;
    const status = error.response?.data?.status;
    const forceLogout = error.response?.data?.forceLogout;

    if (
      statusCode === 403 &&
      (accountStatus === 'suspended' || status === 'suspended' || forceLogout)
    ) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      alert('Your account has been suspended by admin. You have been logged out.');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const getPendingAccounts = () =>
  API.get('/admin/pending-accounts');

export const approveAccount = (userId) =>
  API.put(`/admin/users/${userId}/approve`);

export const rejectAccount = (userId, guidelines) =>
  API.put(`/admin/users/${userId}/reject`, { guidelines });

export const suspendAccount = (userId, reason) =>
  API.put(`/admin/users/${userId}/suspend`, { reason });

export const unsuspendAccount = (userId) =>
  API.put(`/admin/users/${userId}/unsuspend`);

export const endEventByAdmin = (eventId) =>
  API.put(`/admin/events/${eventId}/end`);

export const sendInvitationEmail = (email, role) =>
  API.post('/invitations/send', { email, role });
export const getMarketProducts = () =>
  API.get('/market/products');

export const addMarketProduct = (payload) =>
  API.post('/market/products', payload);

export const getMyMarketProducts = () =>
  API.get('/market/my-products');

export const updateMarketProduct = (productId, payload) =>
  API.put(`/market/products/${productId}`, payload);

export const deleteMarketProduct = (productId) =>
  API.delete(`/market/products/${productId}`);

export const placeMarketOrder = (payload) =>
  API.post('/market/orders', payload);

export const getMyMarketOrders = () =>
  API.get('/market/orders/my');

export const getManageMarketOrders = () =>
  API.get('/market/orders/manage');

export const updateMarketOrderStatus = (orderId, status) =>
  API.put(`/market/orders/${orderId}/status`, { status });

export default API;
