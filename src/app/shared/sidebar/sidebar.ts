import { Component, computed, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <aside
      class="sidebar"
      [class.collapsed]="collapsed()"
      (mouseenter)="isHovered.set(true)"
      (mouseleave)="isHovered.set(false)"
    >
      <!-- Header with Logo -->
      <div class="sidebar-header">
        <div class="logo-wrapper" routerLink="/dashboard">
          @if (settingsService.currentSettings().systemLogo) {
            <img [src]="settingsService.currentSettings().systemLogo" class="logo-img-sidebar" />
          } @else {
            <div class="logo-placeholder">
              <mat-icon>local_pharmacy</mat-icon>
            </div>
          }
          <span class="title text-truncate" *ngIf="!isActuallyCollapsed()">
            {{ settingsService.currentSettings().systemName }}
          </span>
        </div>

        <button
          mat-icon-button
          (click)="toggleCollapse($event)"
          class="toggle-btn"
          [class.centered]="isActuallyCollapsed()"
        >
          <mat-icon>{{ collapsed() ? 'menu' : 'menu_open' }}</mat-icon>
        </button>
      </div>

      <!-- Navigation List -->
      <nav class="nav-list">
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" title="Dashboard">
          <iconify-icon icon="vaadin-dashboard" width="24" height="24"></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Dashboard</span>
        </a>

        <a class="nav-item" routerLink="/products" routerLinkActive="active" title="Inventario">
          <iconify-icon icon="material-symbols:inventory" width="24" height="24"></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Inventario</span>
        </a>

        <a class="nav-item" routerLink="/categories" routerLinkActive="active" title="Categorías">
          <iconify-icon icon="vaadin-records" width="24" height="24"></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Categorías</span>
        </a>

        <a class="nav-item" routerLink="/suppliers" routerLinkActive="active" title="Proveedores">
          <iconify-icon
            icon="material-symbols:delivery-truck-speed"
            width="24"
            height="24"
          ></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Proveedores</span>
        </a>

        <a
          class="nav-item"
          routerLink="/users"
          routerLinkActive="active"
          *ngIf="isAdmin()"
          title="Usuarios"
        >
          <iconify-icon icon="mdi:users" width="24" height="24"></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Usuarios</span>
        </a>

        <a class="nav-item" routerLink="/profile" routerLinkActive="active" title="Mi Perfil">
          <iconify-icon
            icon="solar:user-circle-bold-duotone"
            width="24"
            height="24"
            style="color: #3b82f6;"
          ></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Mi Perfil</span>
        </a>

        <a
          class="nav-item"
          routerLink="/settings"
          routerLinkActive="active"
          *ngIf="isAdmin()"
          title="Configuración"
        >
          <iconify-icon
            icon="solar:settings-bold-duotone"
            width="24"
            height="24"
            style="color: #64748b;"
          ></iconify-icon>
          <span class="nav-label" *ngIf="!isActuallyCollapsed()">Configuración</span>
        </a>
      </nav>

      <div class="spacer"></div>

      <!-- User Profile -->
      <div
        class="user-profile"
        [class.collapsed-profile]="isActuallyCollapsed()"
        *ngIf="user()"
        routerLink="/profile"
      >
        <div class="avatar-wrapper">
          <div
            class="avatar-circle"
            [style.background]="user().avatar ? 'transparent' : getAvatarColor(user().name)"
          >
            @if (user().avatar) {
              <img [src]="user().avatar" class="avatar-img-sidebar" alt="User" />
            } @else {
              <span class="initials-sidebar">{{ getInitials(user().name) }}</span>
            }
          </div>
        </div>

        <div class="user-details" *ngIf="!isActuallyCollapsed()">
          <span class="name">Dr. {{ user().name }}</span>
          <span class="role">{{ isAdmin() ? 'Administrador' : 'Empleado' }}</span>
        </div>

        <button
          *ngIf="!isActuallyCollapsed()"
          mat-icon-button
          (click)="logout()"
          title="Cerrar Sesión"
          class="logout-btn"
        >
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        height: 100vh;
        background: white;
        border-right: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 100;
      }
      .sidebar.collapsed:hover {
        width: 260px !important;
        box-shadow: 10px 0 30px rgba(0,0,0,0.1);
      }
      .sidebar.collapsed {
        width: 70px;
      }

      /* Header & Logo */
      .sidebar-header {
        height: 70px;
        display: flex;
        align-items: center;
        padding: 0 15px;
        border-bottom: 1px solid #f8fafc;
        transition: all 0.3s ease;
        overflow: hidden;
      }
      .sidebar.collapsed:not(:hover) .sidebar-header {
        flex-direction: column;
        justify-content: center;
        height: 90px;
        gap: 5px;
        padding: 10px 0;
      }
      .logo-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
        cursor: pointer;
      }
      .sidebar.collapsed:not(:hover) .logo-wrapper {
        justify-content: center;
        padding: 0;
      }
      .logo-img-sidebar {
        width: 38px;
        height: 38px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid #f1f5f9;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .logo-placeholder {
        width: 38px;
        height: 38px;
        background: #eff6ff;
        color: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .title {
        font-weight: 800;
        font-size: 1.1rem;
        color: #1e3a8a;
        letter-spacing: -0.5px;
      }
      .toggle-btn {
        color: #94a3b8;
        transform: scale(0.9);
      }
      .toggle-btn.centered {
        margin: 0;
      }

      /* Navigation */
      .nav-list {
        padding: 15px 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }
      .nav-item {
        display: flex;
        align-items: center;
        height: 48px;
        margin: 0 12px;
        padding: 0 14px;
        border-radius: 12px;
        color: #64748b;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .nav-item:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .nav-item.active {
        background: #eff6ff;
        color: #3b82f6;
        font-weight: 600;
      }

      /* Collapsed Nav Items - The centering fix */
    .sidebar.collapsed:not(:hover) .nav-item {
      width: 44px;
      height: 44px;
      margin: 4px auto;
      padding: 0;
      justify-content: center;
    }
      .nav-item iconify-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
      }
      .nav-label {
        margin-left: 12px;
        font-size: 0.95rem;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis;
      }

      .spacer {
        flex: 1;
      }

      /* Profile Section */
      .user-profile {
        padding: 12px;
        margin: 10px 12px 20px;
        background: #f8fafc;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
        border: 1px solid #f1f5f9;
        cursor: pointer;
      }
      .user-profile.collapsed-profile {
        margin: 10px auto 20px;
        width: 48px;
        height: 48px;
        padding: 0;
        justify-content: center;
        border-radius: 50%;
      }
      .avatar-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        overflow: hidden;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .avatar-img-sidebar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .initials-sidebar {
        font-size: 0.85rem;
      }
      .user-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }
      .user-details .name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-details .role {
        font-size: 0.75rem;
        color: #64748b;
      }
      .logout-btn {
        color: #94a3b8;
      }
      .logout-btn:hover {
        color: #ef4444;
      }
    `,
  ],
})
export class SidebarComponent {
  private authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  collapsed = signal(localStorage.getItem('sidebarCollapsed') === 'true');
  isHovered = signal(false);

  user = computed(() => this.authService.currentUser());
  isAdmin = computed(() => {
    const u = this.user();
    return u?.role === 'ADMIN' || u?.role === 'ADMINISTRADOR';
  });

  isActuallyCollapsed = computed(() => this.collapsed() && !this.isHovered());

  toggleCollapse(event: Event) {
    event.stopPropagation();
    const newState = !this.collapsed();
    this.collapsed.set(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '??';
    const splitName = String(name).split(' ');
    if (splitName.length > 1 && splitName[1]) {
      return (splitName[0][0] + splitName[1][0]).toUpperCase();
    }
    return splitName[0].substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string | null | undefined): string {
    if (!name) return '#3b82f6';
    const nameStr = String(name);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
