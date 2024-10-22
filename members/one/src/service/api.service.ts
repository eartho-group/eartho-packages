import { useSession } from "next-auth/react";
import config from "@/constants/config";

interface RequestOptions {
  method?: string;
  cache?: string;
  headers?: Record<string, string>;
  body?: any;
  accessToken?: string;
}

class ApiService {
  baseUrl = config.API_URL

  createUrl(endpoint: string | URL, params: Record<string, string>) {
    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return url;
  }

  async request(endpoint: string | URL, options: RequestOptions = {}, params: Record<string, string> = {}) {
    const url = this.createUrl(endpoint, params);

    const defaultHeaders = {
      'auth-provider': 'one.eartho',
      'Authorization': options.accessToken ? `Bearer ${options.accessToken}` : '',
      'Content-Type': 'application/json',
    };

    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    const config: RequestInit = {
      body: options.body || undefined,
      method: options.method,
      headers: headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error making request:", error);
      return null;
    }
  }

  get(endpoint: string | URL, options: RequestOptions = {}, params: Record<string, string> = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    }, params);
  }

  post(endpoint: string | URL, body: any, options: RequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async file(endpoint: string | URL, formData: any, options: RequestOptions = {}) {
    const response = await fetch(this.baseUrl + endpoint,
      {
        method: "POST",
        body: formData,
        headers:{
          'auth-provider': 'one.eartho',
          'Authorization': options.accessToken ? `Bearer ${options.accessToken}` : '',
        }
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  put(endpoint: string | URL, body: any, options: RequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint: string | URL, body: any, options: RequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
      body: JSON.stringify(body),
    });
  }
}

const apiService = new ApiService();
export default apiService;
