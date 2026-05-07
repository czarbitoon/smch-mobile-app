// smch-mobile-app/constants/api.ts
// API Configuration for React Native App

// Use your machine's local IP here for development
// Get it by running: ipconfig (look for IPv4 address)
export const API_CONFIG = {
  // Update this to your machine's IP for testing
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.16.1:8000',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Device Status Constants
export const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  PENDING: 'pending',
};

// Report/Ticket Status Constants
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    LOGOUT: '/api/logout',
    PROFILE: '/api/profile',
  },
  
  // Devices
  DEVICES: {
    LIST: '/api/devices',
    DETAIL: (id: number) => `/api/devices/${id}`,
    STATUS: (id: number) => `/api/devices/${id}/status`,
    CREATE: '/api/devices',
    UPDATE: (id: number) => `/api/devices/${id}`,
    DELETE: (id: number) => `/api/devices/${id}`,
  },
  
  // Reports/Tickets
  REPORTS: {
    LIST: '/api/reports',
    DETAIL: (id: number) => `/api/reports/${id}`,
    CREATE: '/api/reports',
    UPDATE: (id: number) => `/api/reports/${id}`,
    DELETE: (id: number) => `/api/reports/${id}`,
    RESOLVE: (id: number) => `/api/reports/${id}/resolve`,
    UPDATE_STATUS: (id: number) => `/api/reports/${id}/status`,
  },
  
  // Profile
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile/update',
    UPLOAD_PICTURE: '/api/profile/upload-picture',
    UPDATE_OFFICE: '/api/profile/update-office',
  },
  
  // Offices
  OFFICES: {
    LIST: '/api/offices',
    DETAIL: (id: number) => `/api/offices/${id}`,
  },
  
  // Health Check
  HEALTH: '/api/health',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION: 'Please check the submitted data and try again.',
};
