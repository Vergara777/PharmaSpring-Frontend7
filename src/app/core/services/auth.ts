import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSignal: WritableSignal<any> = signal(this.loadUserFromStorage());
  public currentUser = computed(() => this.currentUserSignal());

  constructor(private http: HttpClient, private router: Router) {}

  private loadUserFromStorage(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password });
  }

  saveToken(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  updateUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    return this.currentUserSignal();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN' || user?.role === 'ADMINISTRADOR';
  }

  isEmployee(): boolean {
    const user = this.getUser();
    return user?.role === 'EMPLEADO' || user?.role === 'TRABAJADOR';
  }

  logout() {
    localStorage.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
