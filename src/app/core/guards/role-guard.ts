import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está logueado, redirigir al login
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si la ruta requiere un rol específico (pasado en data: { role: 'ADMIN' })
  const expectedRole = route.data['role'];

  if (expectedRole === 'Administrador' && !authService.isAdmin()) {
    // Si se requiere ADMIN y no lo es, redirigir al dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
