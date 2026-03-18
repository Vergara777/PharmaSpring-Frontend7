import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule
  ],
  template: `
    <nav class="top-navbar">
      <div class="nav-left">
        <div class="logo-container">
          <mat-icon class="logo-icon">local_pharmacy</mat-icon>
          <span class="logo-text">PharmaCare</span>
        </div>
        
        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">Tablero</a>
          <a routerLink="/products" routerLinkActive="active" class="nav-item">Inventario</a>
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">Pedidos</a>
          <a routerLink="/suppliers" routerLinkActive="active" class="nav-item">Proveedores</a>
        </div>
      </div>

      <div class="nav-right">
        <button mat-icon-button class="nav-icon-btn">
          <mat-icon matBadge="3" matBadgeColor="warn" matBadgeSize="small">notifications_none</mat-icon>
        </button>
        <button mat-icon-button class="nav-icon-btn">
          <mat-icon>settings</mat-icon>
        </button>
        
        <div class="user-profile" [matMenuTriggerFor]="userMenu">
          <div class="user-info">
            <span class="user-name">Dr. {{ user()?.name || 'Usuario' }}</span>
            <span class="user-role">{{ isAdmin() ? 'Administrador' : 'Farmacéutico Jefe' }}</span>
          </div>
          <div class="user-avatar">
            {{ user()?.name?.charAt(0) || 'U' }}
          </div>
        </div>

        <mat-menu #userMenu="matMenu" xPosition="before" class="profile-menu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </div>
    </nav>
  `,
  styles: [`
    .top-navbar {
      height: 72px;
      padding: 0 40px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f1f3;
      position: sticky;
      top: 0;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 48px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1e3a8a;
    }

    .logo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      background: #1e3a8a;
      color: white;
      padding: 4px;
      border-radius: 8px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .nav-links {
      display: flex;
      gap: 12px;
    }

    .nav-item {
      padding: 8px 16px;
      text-decoration: none;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .nav-item:hover {
      color: #1e3a8a;
    }

    .nav-item.active {
      color: #1e3a8a;
      background: #f1f5f9;
      position: relative;
    }

    .nav-item.active::after {
      content: '';
      position: absolute;
      bottom: -16px;
      left: 16px;
      right: 16px;
      height: 3px;
      background: #1e3a8a;
      border-radius: 3px 3px 0 0;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-icon-btn {
      color: #64748b;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px;
      border-radius: 30px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .user-profile:hover {
      background: #f8fafc;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .user-role {
      font-size: 12px;
      color: #64748b;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fde6e9; /* Light pink as in image */
      color: #e11d48;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 0 0 1px #f1f5f9;
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  
  user = () => this.authService.getUser();
  isAdmin = () => this.authService.isAdmin();

  logout() {
    this.authService.logout();
  }
}
