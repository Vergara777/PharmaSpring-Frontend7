import { Component, inject, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <!-- Welcome Card -->

    <div class="dashboard-container">
      <!-- Header -->
      <header class="top-header">
        <div class="search-bar">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar productos, usuarios o categorías..." />
        </div>
        <!-- Actions removed as they are now global/sidebar based -->
      </header>
      <!-- Welcome Notification -->
      <div class="welcome-notification" *ngIf="showWelcome()">
        <div class="welcome-content">
          <div class="text">
            <h3>¡Bienvenido de nuevo, {{ user?.name }}! <span class="waving-hand">👋</span></h3>
            <p class="text-muted">Aquí tienes un resumen actualizado del sistema de farmacia.</p>
          </div>
          <button mat-icon-button class="close-btn" (click)="showWelcome.set(false)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

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
          <mat-card class="stat-card" [routerLink]="loading() ? null : '/products'">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">Total precio inventario</span>
                <h2 class="stat-value" *ngIf="!loading()">{{ stats().total_price_inventory | currency:'USD':'symbol':'1.0-2' }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend" *ngIf="!loading()">Precio total del inventario</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-blue" *ngIf="!loading()">
                <iconify-icon icon="carbon:inventory-management" width="24" height="24"></iconify-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>
          <!-- Card 3 -->
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

          <!-- Card 4 -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : isAdmin() ? '/users' : null">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">{{ isAdmin() ? 'Usuarios' : 'Trabajadores' }}</span>
                <h2 class="stat-value" *ngIf="!loading()">{{ stats().users }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend" *ngIf="!loading()">Personal registrado</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-green" *ngIf="!loading()">
                <mat-icon>people</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>

          <!-- Card 5 (Low Stock) -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : '/products'">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">Stock Bajo</span>
                <h2 class="stat-value text-warning" *ngIf="!loading()">{{ stats().lowStock }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend warning" *ngIf="!loading()">Necesitan reposición</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-warning-light" *ngIf="!loading()">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>

          <!-- Card 6 (Agotados) -->
          <mat-card class="stat-card" [routerLink]="loading() ? null : '/products'">
            <div class="stat-content" [class.skeleton]="loading()">
              <div class="stat-info">
                <span class="stat-label">Agotados</span>
                <h2 class="stat-value text-danger" *ngIf="!loading()">{{ stats().outOfStock }}</h2>
                <div class="skeleton-text value" *ngIf="loading()"></div>
                <span class="stat-trend danger" *ngIf="!loading()">Acción inmediata</span>
                <div class="skeleton-text small" *ngIf="loading()"></div>
              </div>
              <div class="stat-icon-wrapper bg-danger-light" *ngIf="!loading()">
                <mat-icon>running_with_errors</mat-icon>
              </div>
              <div class="skeleton-circle" *ngIf="loading()"></div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --bg-color: #f8f9fa;
        --text-main: #202124;
        --text-muted: #5f6368;
        --primary: #1976d2;
      }

      .dashboard-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 20px 0 0 0;
        background: white;
        margin-top: 10px;
        box-shadow: -10px 0 20px rgba(0, 0, 0, 0.02);
      }

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
      .search-bar mat-icon {
        color: var(--text-muted);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .search-bar input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 14px;
        color: var(--text-main);
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
      .action-btn {
        color: var(--text-muted);
      }

      /* Body Styles */
      .dashboard-body {
        padding: 32px;
        overflow-y: auto;
        flex: 1;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
      .stat-card:hover {
        transform: translateY(-4px);
        border-color: var(--primary);
      }
      .stat-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .stat-label {
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        margin: 8px 0;
        color: var(--text-main);
      }
      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #1e8e3e;
      }

      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stat-icon-wrapper mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .bg-blue {
        background: #e8f0fe;
        color: #1967d2;
      }
      .bg-purple {
        background: #f3e8fd;
        color: #9334e6;
      }
      .bg-green {
        background: #e6f4ea;
        color: #1e8e3e;
      }
      .bg-warning-light {
        background: #fff4e5;
        color: #ed6c02;
      }
      .bg-danger-light {
        background: #fdecea;
        color: #d32f2f;
      }

      .text-warning {
        color: #ed6c02;
      }
      .text-danger {
        color: #d32f2f;
      }
      .stat-trend.warning {
        color: #ed6c02;
        opacity: 0.8;
      }
      .stat-trend.danger {
        color: #d32f2f;
        opacity: 0.8;
      }

      /* Skeleton Loading Styles */
      .skeleton-text {
        background: #f1f3f4;
        border-radius: 4px;
        position: relative;
        overflow: hidden;
      }
      .skeleton-text.value {
        width: 60px;
        height: 32px;
        margin: 8px 0;
      }
      .skeleton-text.small {
        width: 120px;
        height: 14px;
        margin-top: 4px;
      }
      .skeleton-circle {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #f1f3f4;
        position: relative;
        overflow: hidden;
      }

      .skeleton:after,
      .skeleton-text:after,
      .skeleton-circle:after {
        content: '';
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
        100% {
          transform: translateX(100%);
        }
      }

      /* Welcome Notification Float */
      .welcome-notification {
        position: fixed;
        top: 90px;
        right: 32px;
        z-index: 1000;
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        border: 1px solid #f0f0f0;
        border-left: 4px solid var(--primary);
        width: 320px;
        animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .welcome-notification .welcome-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .welcome-notification h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 4px 0;
        color: var(--primary);
      }
      .welcome-notification p {
        margin: 0;
        font-size: 13px;
        line-height: 1.4;
      }
      .welcome-notification .close-btn {
        margin-top: -8px;
        margin-right: -8px;
        color: var(--text-muted);
        transform: scale(0.8);
      }
      @keyframes slideInRight {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .waving-hand {
        display: inline-block;
        transform-origin: 70% 70%;
        animation: wave 2.5s infinite linear;
      }
      
      @keyframes wave {
        0% { transform: rotate(0deg); }
        10% { transform: rotate(14deg); }
        20% { transform: rotate(-8deg); }
        30% { transform: rotate(14deg); }
        40% { transform: rotate(-4deg); }
        50% { transform: rotate(10deg); }
        60% { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }

      .text-muted {
        color: var(--text-muted);
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);

  user = this.authService.getUser();
  stats = signal({ products: 0, categories: 0, users: 0, lowStock: 0, outOfStock: 0, total_price_inventory: 0 });
  loading = signal(true);
  showWelcome = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadStats() {
    this.loading.set(true);
    forkJoin({
      products: this.productService.getAll(),
      categories: this.categoryService.getAll(),
      users: this.userService.getAll(),
    }).subscribe({
      next: (res: any) => {
        const prodData = Array.isArray(res.products) ? res.products : res.products?.content || [];

        // Compute total inventory value based on stock * price
        const totalValue = prodData.reduce((acc: number, p: any) => {
          const price = parseFloat(p.price) || parseFloat(p.price_unit) || parseFloat(p.price_package) || 0;
          const stock = parseInt(p.stock) || 0;
          return acc + (price * stock);
        }, 0);

        this.stats.set({
          products: this.getCount(res.products),
          categories: this.getCount(res.categories),
          users: this.getCount(res.users),
          lowStock: prodData.filter((p: any) => p.stock > 0 && p.stock <= 40).length,
          outOfStock: prodData.filter((p: any) => p.stock === 0).length,
          total_price_inventory: totalValue,
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando estadísticas', err);
        this.loading.set(false);
      },
    });
  }

  private getCount(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.content)) return data.content.length;
    if (data && typeof data.totalElements === 'number') return data.totalElements;
    return 0;
  }
}
