import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'localrent.token';
const USER_KEY = 'localrent.user';

export interface UserResponse {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isOwner = computed(() => this.currentUser()?.role === 'OWNER');

  constructor(private readonly http: HttpClient) {}

  signup(payload: { name: string; phone: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/signup`, payload)
      .pipe(tap((response) => this.persist(response)));
  }

  login(payload: { phone: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persist(response)));
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/google`, { idToken })
      .pipe(tap((response) => this.persist(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  updatePhone(phone: string): Observable<void> {
  return this.http.put<void>(`${environment.apiBaseUrl}/auth/phone`, { phone });
  }

  // Updated to match your AuthController endpoint: /api/auth/me
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.apiBaseUrl}/auth/me`);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
