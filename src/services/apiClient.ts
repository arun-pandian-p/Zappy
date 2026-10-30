/**
 * Zappy Java Spring Boot API Client
 * Centralized, type-safe API client for Sprint 01 migrated endpoints.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
    restaurantId: string | null;
  };
}

export interface GenericApiResponse {
  success: boolean;
  message: string;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  favicon_url?: string;
  menu_title?: string;
  address?: string;
  phone?: string;
  email?: string;
  google_review_url?: string;
  tax_rate?: number;
  service_charge_rate?: number;
  currency?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  subscription_tier?: string;
  is_active?: boolean;
  ads_enabled?: boolean;
  settings?: any;
  printer_settings?: any;
  review_settings?: any;
  theme_config?: any;
  feature_toggles?: any;
}

export interface OverviewStats {
  totalOrdersToday: number;
  totalRevenueToday: number;
  activeTables: number;
  totalTables: number;
  pendingOrders: number;
  completedOrdersToday: number;
  averageRating: number;
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('zappy_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  // --- Authentication APIs ---

  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await this.handleResponse<AuthTokens>(response);
    
    // Persist session tokens locally
    localStorage.setItem('zappy_access_token', data.accessToken);
    localStorage.setItem('zappy_refresh_token', data.refreshToken);
    localStorage.setItem('zappy_user', JSON.stringify(data.user));
    
    return data;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await this.handleResponse<AuthTokens>(response);
    localStorage.setItem('zappy_access_token', data.accessToken);
    localStorage.setItem('zappy_refresh_token', data.refreshToken);
    return data;
  }

  async forgotPassword(email: string): Promise<GenericApiResponse> {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<GenericApiResponse>(response);
  }

  async resetPassword(token: string, newPassword: string): Promise<GenericApiResponse> {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return this.handleResponse<GenericApiResponse>(response);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...this.getAuthHeader() },
      });
    } finally {
      localStorage.removeItem('zappy_access_token');
      localStorage.removeItem('zappy_refresh_token');
      localStorage.removeItem('zappy_user');
    }
  }

  async getMe(): Promise<AuthTokens['user']> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...this.getAuthHeader() },
    });
    return this.handleResponse<AuthTokens['user']>(response);
  }

  // --- Restaurant Profile & Settings APIs ---

  async getRestaurant(id: string): Promise<RestaurantProfile> {
    const response = await fetch(`${API_BASE}/restaurants/${id}`, {
      headers: { ...this.getAuthHeader() },
    });
    return this.handleResponse<RestaurantProfile>(response);
  }

  async getRestaurantBySlug(slug: string): Promise<RestaurantProfile> {
    const response = await fetch(`${API_BASE}/restaurants/slug/${slug}`);
    return this.handleResponse<RestaurantProfile>(response);
  }

  async updateRestaurant(id: string, updates: Partial<RestaurantProfile>): Promise<RestaurantProfile> {
    const response = await fetch(`${API_BASE}/restaurants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
    return this.handleResponse<RestaurantProfile>(response);
  }

  async uploadLogo(id: string, file: File): Promise<RestaurantProfile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/restaurants/${id}/logo`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
      },
      body: formData,
    });
    return this.handleResponse<RestaurantProfile>(response);
  }

  async getOverviewStats(id: string): Promise<OverviewStats> {
    const response = await fetch(`${API_BASE}/restaurants/${id}/overview-stats`, {
      headers: { ...this.getAuthHeader() },
    });
    return this.handleResponse<OverviewStats>(response);
  }
}

export const apiClient = new ApiClient();

