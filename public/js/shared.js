const API_BASE = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('access_token');
}

function getLoggedInUser() {
    try {
        return JSON.parse(localStorage.getItem('loggedInUser')) || null;
    } catch (error) {
        console.error('Erro ao ler loggedInUser:', error);
        return null;
    }
}

function apiHeaders(contentType = true) {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (contentType) headers['Content-Type'] = 'application/json';
    return headers;
}

async function apiFetch(path, options = {}) {
    const defaultHeaders = apiHeaders(options.contentType !== false);
    options.headers = {
        ...defaultHeaders,
        ...(options.headers || {})
    };
    const response = await fetch(`${API_BASE}${path}`, options);
    if (response.status === 401) {
        logout();
    }
    return response;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('loggedInUser');
    window.location.href = '/public/pages/login.html';
}

function formatCurrency(value) {
    return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}
