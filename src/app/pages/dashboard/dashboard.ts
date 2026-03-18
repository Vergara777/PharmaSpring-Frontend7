import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { UserService } from '../../core/services/user';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatIconModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="top-header">
        <div class="search-bar">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar productos, usuarios o categorías...">
        </div>
        <div class="header-actions">
          <button mat-icon-button class="action-btn">
            <mat-icon>notifications</mat-icon>
          </button>
          <button mat-icon-button class="action-btn">
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </header>

      <!-- Main Scrollable Area -->
      <div class="dashboard-body">
        <!-- Summary Cards -->
        <div class="stats-grid">
          <!-- Card 1 -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : '/products'">
            <!-- ... content unchanged ... -->
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">Total Productos</span>
                <h2 class="stat-value" *ngIf="!loading()">{{ stats().products }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend" *ngIf="!loading()">Catálogo de medicamentos</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-blue" *ngIf="!loading()">
                <mat-icon>medication</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>

          <!-- Card 2 -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : '/categories'">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">Categorías</span>
                <h2 class="stat-value" *ngIf="!loading()">{{ stats().categories }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend" *ngIf="!loading()">Organización de stock</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-purple" *ngIf="!loading()">
                <mat-icon>category</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>

          <!-- Card 3 -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : (isAdmin() ? '/users' : null)">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">{{ isAdmin() ? 'Usuarios' : 'Trabajadores' }}</span>
                <h2 class="stat-value" *ngIf="!loading()">{{ stats().users }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend" *ngIf="!loading()">
                  {{ isAdmin() ? 'Personal registrado' : 'Equipo de trabajo' }}
                </span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-green" *ngIf="!loading()">
                <mat-icon>people</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>
        </div>

        <!-- Welcome Card -->
        <div class="section-container">
           <mat-card class="welcome-card">
              <div class="welcome-content">
                <div class="text">
                  <h3>¡Bienvenido de nuevo, {{ user?.name }}!</h3>
                  <p class="text-muted">Aquí tienes un resumen actualizado del sistema de farmacia.</p>
                </div>
                <mat-icon class="welcome-illustration">dashboard</mat-icon>
              </div>
           </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --bg-color: #f8f9fa; --text-main: #202124; --text-muted: #5f6368; --primary: #1976d2; }
    
    .dashboard-container { display: flex; flex-direction: column; height: 100%; border-radius: 20px 0 0 0; background: white; margin-top: 10px; box-shadow: -10px 0 20px rgba(0,0,0,0.02); }

    /* Header Styles */
    .top-header {
      height: 70px;
      padding: 0 32px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f0f0;
    }
    .search-bar {
      display: flex;
      align-items: center;
      background: #f1f3f4;
      padding: 8px 16px;
      border-radius: 8px;
      width: 400px;
      gap: 12px;
    }
    .search-bar mat-icon { color: var(--text-muted); font-size: 20px; width: 20px; height: 20px; }
    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 14px;
      color: var(--text-main);
    }
    .header-actions { display: flex; gap: 8px; }
    .action-btn { color: var(--text-muted); }

    /* Body Styles */
    .dashboard-body { padding: 32px; overflow-y: auto; flex: 1; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .stat-card {
      padding: 24px;
      border-radius: 16px !important;
      border: 1px solid #f0f0f0;
      box-shadow: none !important;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }
    .stat-card:hover { transform: translateY(-4px); border-color: var(--primary); }
    .stat-content { display: flex; justify-content: space-between; align-items: flex-start; }
    .stat-label { color: var(--text-muted); font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 28px; font-weight: 700; margin: 8px 0; color: var(--text-main); }
    .stat-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; color: #1e8e3e; }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon-wrapper mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .bg-blue { background: #e8f0fe; color: #1967d2; }
    .bg-purple { background: #f3e8fd; color: #9334e6; }
    .bg-green { background: #e6f4ea; color: #1e8e3e; }

    /* Skeleton Loading Styles */
    .skeleton-text {
      background: #f1f3f4;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .skeleton-text.value { width: 60px; height: 32px; margin: 8px 0; }
    .skeleton-text.small { width: 120px; height: 14px; margin-top: 4px; }
    .skeleton-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f1f3f4;
      position: relative;
      overflow: hidden;
    }

    .skeleton:after, .skeleton-text:after, .skeleton-circle:after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.5) 20%,
        rgba(255, 255, 255, 0.8) 60%,
        rgba(255, 255, 255, 0)
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }

    .welcome-card {
      padding: 32px;
      border-radius: 16px !important;
      border: 1px solid #f0f0f0;
      box-shadow: none !important;
      background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
    }
    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .welcome-content h3 { font-size: 24px; font-weight: 700; margin: 0; color: var(--primary); }
    .welcome-illustration { font-size: 64px; width: 64px; height: 64px; color: var(--primary); opacity: 0.1; }

    .text-muted { color: var(--text-muted); }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);
  
  user = this.authService.getUser();
  stats = signal({ products: 0, categories: 0, users: 0 });
  loading = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadStats() {
    this.loading.set(true);
    setTimeout(() => {
      forkJoin({
        products: this.productService.getAll(),
        categories: this.categoryService.getAll(),
        users: this.userService.getAll()
      }).subscribe({
        next: (res: any) => {
          this.stats.set({
            // Soportar tanto arrays directos como objetos Page de Spring Boot (.content)
            products: this.getCount(res.products),
            categories: this.getCount(res.categories),
            users: this.getCount(res.users)
          });
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando estadísticas', err);
          this.loading.set(false);
        }
      });
    }, 1000); 
  }

  private getCount(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.content)) return data.content.length;
    if (data && typeof data.totalElements === 'number') return data.totalElements;
    return 0;
  }
}