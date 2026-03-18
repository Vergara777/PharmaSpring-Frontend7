import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule, MatButtonModule],
  template: `
    <div class="sidebar" 
         [class.collapsed]="isActuallyCollapsed()"
         (mouseenter)="isHovered.set(true)"
         (mouseleave)="isHovered.set(false)">
      <div class="sidebar-header">
        <div class="logo-container" *ngIf="!isActuallyCollapsed()">
          <mat-icon class="logo-icon">local_pharmacy</mat-icon>
          <span class="title">PharmaSys</span>
        </div>
        <button mat-icon-button (click)="toggleCollapse($event)" class="toggle-btn">
          <mat-icon>{{ collapsed() ? 'menu' : 'menu_open' }}</mat-icon>
        </button>
      </div>
      
      <mat-nav-list class="nav-list">
        <a mat-list-item routerLink="/dashboard" routerLinkActive="active" title="Dashboard">
          <mat-icon matListItemIcon>dashboard</mat-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Dashboard</span>
        </a>
        <a mat-list-item routerLink="/products" routerLinkActive="active" title="Productos">
          <mat-icon matListItemIcon>medication</mat-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Productos</span>
        </a>
        <a mat-list-item routerLink="/categories" routerLinkActive="active" title="Categorías">
          <mat-icon matListItemIcon>category</mat-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Categorías</span>
        </a>
        <a mat-list-item routerLink="/suppliers" routerLinkActive="active" title="Proveedores">
          <mat-icon matListItemIcon>local_shipping</mat-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Proveedores</span>
        </a>
        <a mat-list-item routerLink="/users" routerLinkActive="active" title="Usuarios" *ngIf="isAdmin()">
          <mat-icon matListItemIcon>people</mat-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Usuarios</span>
        </a>
      </mat-nav-list>

      <div class="spacer"></div>

      <div class="user-profile" *ngIf="user">
        <div class="avatar-wrapper">
          <div class="avatar-circle">
            <div class="avatar-inner"></div>
          </div>
        </div>
        
        <div class="user-details" *ngIf="!isActuallyCollapsed()">
          <span class="name">Dr. {{ user.name }}</span>
          <span class="role">{{ isAdmin() ? 'Administrador' : 'Empleado' }}</span>
        </div>

        <button *ngIf="!isActuallyCollapsed()" mat-icon-button (click)="logout()" title="Cerrar Sesión" class="logout-btn">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </div>
    <!-- Placeholder to keep the space while sidebar is fixed/floating -->
    <div class="sidebar-spacer" [class.collapsed]="isActuallyCollapsed()"></div>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #ffffff;
      color: #333;
      display: flex;
      flex-direction: column;
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s;
      border-right: 1px solid #f1f5f9;
      position: fixed; /* Fixed so it doesn't push the whole page on hover */
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 4px 0 15px rgba(0,0,0,0.03);
    }
    .sidebar.collapsed { 
      width: 76px; 
      box-shadow: none;
    }
    
    .sidebar-spacer {
      width: 260px;
      flex-shrink: 0;
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar-spacer.collapsed { width: 76px; }

    .sidebar:not(.collapsed) {
      box-shadow: 20px 0 40px rgba(0,0,0,0.08);
    }

    .sidebar-header {
      padding: 0 20px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }
    .sidebar.collapsed .sidebar-header { justify-content: center; padding: 0; }
    
    .logo-container { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      color: #1e3a8a;
      white-space: nowrap;
    }
    .logo-icon { 
      font-size: 24px; 
      width: 24px; 
      height: 24px; 
      background: linear-gradient(135deg, #1e40af, #2563eb);
      color: white; 
      padding: 8px; 
      border-radius: 10px; 
      box-shadow: 0 4px 10px rgba(30,64,175,0.25);
    }
    .title { font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
    .toggle-btn { color: #94a3b8; }
    
    .nav-list { padding: 12px; }
    mat-nav-list a {
      margin-bottom: 6px;
      border-radius: 12px;
      color: #64748b !important;
      height: 50px;
      font-weight: 600;
      transition: all 0.2s;
    }
    mat-nav-list a.active {
      background: #f1f5f9 !important;
      color: #1e40af !important;
    }
    mat-nav-list a.active mat-icon { color: #1e40af !important; }
    
    .spacer { flex: 1; }
    
    .user-profile {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      min-height: 80px;
    }
    
    .sidebar.collapsed .user-profile {
      justify-content: center;
      padding: 16px 0;
    }
    
    .avatar-wrapper {
      flex-shrink: 0;
    }
    
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fde6e9; /* Light pink from image */
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar-inner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #f8dbde; /* Slightly darker pink circle inside */
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .user-details { 
      display: flex; 
      flex-direction: column; 
      flex: 1;
      min-width: 0; 
    }
    
    .name { 
      font-size: 14px; 
      font-weight: 600; 
      color: #1e293b; 
      white-space: nowrap; 
      text-overflow: ellipsis; 
      overflow: hidden; 
    }
    
    .role { 
      font-size: 12px; 
      color: #94a3b8; 
      white-space: nowrap;
      text-overflow: ellipsis; 
      overflow: hidden;
    }
    
    .logout-btn { 
      color: #64748b; 
      width: 38px !important;
      height: 38px !important;
      background: #f8fafc;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .logout-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  collapsed = signal(localStorage.getItem('sidebar-collapsed') === 'true');
  isHovered = signal(false);
  isActuallyCollapsed = computed(() => this.collapsed() && !this.isHovered());
  user = this.authService.getUser();

  toggleCollapse(event: Event) {
    event.stopPropagation();
    const newState = !this.collapsed();
    this.collapsed.set(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}