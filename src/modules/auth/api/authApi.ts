import { apiClient } from '../../../api/client';

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  interest?: string;
}

const authEndpoint = '/api';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post(`${authEndpoint}/login`, {
    email,
    password,
  });
  return response.data;
};

export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const response = await apiClient.post(`${authEndpoint}/signup`, {
    email: data.email,
    username: data.username,
    password: data.password,
    confirmPassword: data.password,
    interest: data.interest,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post(`${authEndpoint}/logout`);
};
