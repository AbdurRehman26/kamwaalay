import api from './api';

export const authService = {
    // Store token
    setToken(token) {
        localStorage.setItem('auth_token', token);
    },

    // Get token
    getToken() {
        return localStorage.getItem('auth_token');
    },

    // Remove token
    removeToken() {
        localStorage.removeItem('auth_token');
    },

    // Check if authenticated
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    // Login
    async login(credentials) {
        const response = await api.post('/login', credentials);
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response.data;
    },

    // Register
    async register(data) {
        const response = await api.post('/register', data);
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response.data;
    },

    // Logout
    async logout() {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.removeToken();
        }
    },

    // Get current user
    async getCurrentUser() {
        const response = await api.get('/user');
        return response.data;
    },

    // Verify OTP
    async verifyOtp(data, verificationToken = null) {
        const payload = { ...data };
        if (verificationToken) {
            payload.verification_token = verificationToken;
        }
        const response = await api.post('/verify-otp', payload);
        if (response.data.token) {
            this.setToken(response.data.token);
            // Clear verification token after successful verification
            this.removeVerificationToken();
        }
        return response.data;
    },

    // Resend OTP
    async resendOtp(verificationToken = null) {
        const payload = {};
        if (verificationToken) {
            payload.verification_token = verificationToken;
        }
        const response = await api.post('/verify-otp/resend', payload);
        return response.data;
    },

    // Get verification info
    async getVerificationInfo(verificationToken = null) {
        const params = {};
        if (verificationToken) {
            params.verification_token = verificationToken;
        }
        const response = await api.get('/verify-otp', { params });
        return response.data;
    },

    // Store verification token
    setVerificationToken(token) {
        localStorage.setItem('verification_token', token);
    },

    // Get verification token
    getVerificationToken() {
        return localStorage.getItem('verification_token');
    },

    // Remove verification token
    removeVerificationToken() {
        localStorage.removeItem('verification_token');
    },
};

