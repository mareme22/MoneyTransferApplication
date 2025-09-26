import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, LoginResponse, UserProfile } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Erreur de connexion');
          }
          return response.data;
        }),
        tap(loginData => {
          this.setAuth(loginData.token, loginData.user);
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur de connexion'));
        })
      );
  }

  register(userData: RegisterRequest): Observable<void> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de l\'inscription');
          }
          return;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors de l\'inscription'));
        })
      );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUserProfile(): UserProfile | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    };
  }

  // Vérifier si le token est expiré
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch (error) {
      return true;
    }
  }
}
