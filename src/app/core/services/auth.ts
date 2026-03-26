import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

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
    // Limpiar espacio en localStorage si es necesario
    this.cleanupStorageIfNeeded();
    
    localStorage.setItem('token', token);
    
    // El try-catch de abajo atrapará si la imagen base64 es demasiado inmensa para la cuota del LocalStorage
    const minimalUser = {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      avatar: user?.avatar
    };
    
    try {
      localStorage.setItem('user', JSON.stringify(minimalUser));
      this.currentUserSignal.set(minimalUser);
    } catch (e) {
      // Si aún falla, eliminar todo menos token y reintentar
      this.clearNonEssentialStorage();
      try {
        localStorage.setItem('user', JSON.stringify(minimalUser));
        this.currentUserSignal.set(minimalUser);
      } catch (e2) {
        // Último recurso: guardar sin avatar
        const fallbackUser = { ...minimalUser, avatar: null };
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        this.currentUserSignal.set(fallbackUser);
        Swal.fire({
          title: 'Aviso de Memoria',
          text: 'La imagen de perfil que elegiste es demasiado masiva para la sesión local. Iniciaste correctamente, pero tu foto no pudo guardarse.',
          icon: 'warning',
          confirmButtonColor: '#f59e0b' /* Naranja advertencia profesional */
        });
      }
    }
  }

  private cleanupStorageIfNeeded() {
    // Limpiar cachés grandes que no son esenciales para el login
    const keysToClean = ['pharma-products-cols', 'pharma-system-settings_backup'];
    for (const key of keysToClean) {
      const item = localStorage.getItem(key);
      if (item && item.length > 50000) {
        localStorage.removeItem(key);
      }
    }
  }

  private clearNonEssentialStorage() {
    // Preservar solo token, eliminar todo lo demás si es necesario
    const token = localStorage.getItem('token');
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key !== 'token') {
        localStorage.removeItem(key);
      }
    }
    if (token) localStorage.setItem('token', token);
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
    const role = user?.role?.toLowerCase();
    return role === 'administrador' || role === 'admin';
  }

  isEmployee(): boolean {
    const user = this.getUser();
    const role = user?.role?.toLowerCase();
    return role === 'trabajador' || role === 'empleado' || role === 'user';
  }

  logout() {
    // Mantener los ajustes del sistema y el estado del sidebar al cerrar sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
