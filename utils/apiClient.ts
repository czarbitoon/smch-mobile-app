// smch-mobile-app/utils/apiClient.ts
// API Client Utility for React Native App

import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../constants/api';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string = API_CONFIG.BASE_URL;
  private timeout: number = API_CONFIG.TIMEOUT;

  /**
   * Make authenticated API request
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { 
      method = 'GET', 
      headers = {}, 
      body, 
      token 
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      ...API_CONFIG.HEADERS,
      ...headers,
    };

    // Add authorization token if provided
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      timeout: this.timeout,
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: any,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'POST', 
      body, 
      token 
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: any,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'PUT', 
      body, 
      token 
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'DELETE', 
      token 
    });
  }

  /**
   * Device API calls
   */
  async getDevices(token: string) {
    return this.get(API_ENDPOINTS.DEVICES.LIST, token);
  }

  async getDevice(deviceId: number, token: string) {
    return this.get(API_ENDPOINTS.DEVICES.DETAIL(deviceId), token);
  }

  async getDeviceStatus(deviceId: number, token: string) {
    return this.get(API_ENDPOINTS.DEVICES.STATUS(deviceId), token);
  }

  /**
   * Report API calls
   */
  async getReports(token: string) {
    return this.get(API_ENDPOINTS.REPORTS.LIST, token);
  }

  async getReport(reportId: number, token: string) {
    return this.get(API_ENDPOINTS.REPORTS.DETAIL(reportId), token);
  }

  async createReport(reportData: any, token: string) {
    return this.post(API_ENDPOINTS.REPORTS.CREATE, reportData, token);
  }

  async updateReportStatus(reportId: number, status: string, token: string) {
    return this.post(
      API_ENDPOINTS.REPORTS.UPDATE_STATUS(reportId),
      { status },
      token
    );
  }

  /**
   * Profile API calls
   */
  async getProfile(token: string) {
    return this.get(API_ENDPOINTS.PROFILE.GET, token);
  }

  async updateProfile(profileData: any, token: string) {
    return this.post(API_ENDPOINTS.PROFILE.UPDATE, profileData, token);
  }

  async updateOffice(officeId: number, token: string) {
    return this.post(
      API_ENDPOINTS.PROFILE.UPDATE_OFFICE,
      { office_id: officeId },
      token
    );
  }

  /**
   * Auth API calls
   */
  async login(email: string, password: string) {
    return this.post<{ token: string; user: any }>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );
  }

  async register(userData: any) {
    return this.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  }

  async logout(token: string) {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT, {}, token);
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get(API_ENDPOINTS.HEALTH);
  }

  /**
   * Error handling
   */
  private handleError<T>(error: any): ApiResponse<T> {
    console.error('API Error:', error);

    let message = ERROR_MESSAGES.SERVER_ERROR;

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNABORTED')) {
        message = ERROR_MESSAGES.TIMEOUT;
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        message = ERROR_MESSAGES.NETWORK;
      } else if (error.message.includes('401')) {
        message = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (error.message.includes('403')) {
        message = ERROR_MESSAGES.FORBIDDEN;
      } else if (error.message.includes('404')) {
        message = ERROR_MESSAGES.NOT_FOUND;
      } else {
        message = error.message;
      }
    }

    return {
      success: false,
      error: message,
      message,
    };
  }
}

export const apiClient = new ApiClient();
