import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define types for our API response
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private baseURL: string = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // You can add auth token here if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors here (e.g., 401 Unauthorized)
        if (error.response?.status === 401) {
          // Handle unauthorized access (e.g., redirect to login)
          console.error('Unauthorized access - please login again');
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // GET request
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle errors
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
      return new Error(
        error.response.data.message || 'An error occurred while processing your request.'
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return new Error('No response received from the server. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
      return new Error(error.message || 'An error occurred while setting up the request.');
    }
  }
}

export default ApiService.getInstance();
