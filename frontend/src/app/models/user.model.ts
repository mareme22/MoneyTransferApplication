
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
  country: string;
  profilePhoto: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  fullName: string;
  initials: string;
}
