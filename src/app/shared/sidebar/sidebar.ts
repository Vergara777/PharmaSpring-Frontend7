import { Component, signal, inject, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule, MatButtonModule, MatTooltipModule],
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
          <iconify-icon icon="vaadin-dashboard" width="24" height="24" matListItemIcon></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Dashboard</span>
        </a>
        <a mat-list-item routerLink="/products" routerLinkActive="active" title="Inventario">
          <iconify-icon icon="material-symbols:inventory" width="24" height="24" matListItemIcon></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Inventario</span>
        </a>
        <a mat-list-item routerLink="/categories" routerLinkActive="active" title="Categorías">
          <iconify-icon icon="vaadin-records" width="24" height="24" matListItemIcon></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Categorías</span>
        </a>
        <a mat-list-item routerLink="/suppliers" routerLinkActive="active" title="Proveedores">
          <iconify-icon icon="material-symbols:delivery-truck-speed" width="24" height="24" matListItemIcon></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Proveedores</span>
        </a>
        <a mat-list-item routerLink="/users" routerLinkActive="active" title="Usuarios" *ngIf="isAdmin()">
          <iconify-icon icon = "mdi:users" width="24" height="24" matListItemIcon></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Usuarios</span>
        </a>
        <a mat-list-item routerLink="/profile" routerLinkActive="active" title="Mi Perfil">
          <iconify-icon icon="solar:user-circle-bold-duotone" width="24" height="24" matListItemIcon style="color: #3b82f6;"></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Mi Perfil</span>
        </a>
        <a mat-list-item routerLink="/settings" routerLinkActive="active" title="Configuración" *ngIf="isAdmin()">
          <iconify-icon icon="solar:settings-bold-duotone" width="24" height="24" matListItemIcon style="color: #64748b;"></iconify-icon>
          <span matListItemTitle *ngIf="!isActuallyCollapsed()">Configuración</span>
        </a>
      </mat-nav-list>

      <div class="spacer"></div>

      <div class="user-profile cursor-pointer" *ngIf="user()" routerLink="/profile" matTooltip="Ver mi Perfil">
        <div class="avatar-wrapper">
          <div class="avatar-circle" [style.background]="user().avatar ? 'transparent' : getAvatarColor(user().name)">
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

        <button *ngIf="!isActuallyCollapsed()" mat-icon-button (click)="logout()" title="Cerrar Sesión" class="logout-btn">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </div>

    <!-- 🚪 Drawer de Notificaciones Beast -->
    <div class="notif-drawer-overlay" [class.show]="notificationService.showDrawer()" (click)="notificationService.showDrawer.set(false)"></div>
    <div class="notif-drawer shadow-2xl" [class.show]="notificationService.showDrawer()">
       <div class="drawer-header p-4 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
             <div class="icon-pulse bg-orange-soft text-orange">
                <iconify-icon icon="solar:bell-bing-bold-duotone" width="28"></iconify-icon>
             </div>
             <div>
                <h4 class="fw-800 mb-0">Alertas de Inventario</h4>
                <p class="x-small text-muted mb-0">Monitorización crítica activa</p>
             </div>
          </div>
          <button class="btn-close-drawer" (click)="notificationService.showDrawer.set(false)">
             <iconify-icon icon="solar:close-circle-bold-duotone" width="24"></iconify-icon>
          </button>
       </div>

       <div class="drawer-body p-3 scroll-styled">
          @if (notificationService.totalAlerts() === 0) {
             <div class="empty-notifs text-center py-5">
                <iconify-icon icon="solar:star-fall-bold-duotone" width="60" class="opacity-10 mb-3"></iconify-icon>
                <p class="text-muted small fw-600">¡Todo en orden hoy!</p>
             </div>
          }

          @for (alert of notificationService.alerts(); track alert.id) {
             <div class="alert-item p-3 rounded-4 mb-3" 
                  [class.critical]="alert.importance === 'HIGH'"
                  [class.overstock-row]="alert.type === 'OVERSTOCK'"
                  (click)="viewInInventory(alert.id)">
                
                <div class="d-flex gap-3 align-items-center">
                   <div class="product-thumb">
                      <img [src]="alert.image" alt="Product" onerror="this.src='assets/images/default-product.png'" />
                   </div>
                   
                   <div class="flex-grow-1 min-w-0">
                      <div class="d-flex justify-content-between align-items-start">
                         <div class="d-flex flex-column min-w-0">
                            <h5 class="product-name fw-800 text-truncate mb-0">{{ alert.name }}</h5>
                            <div class="d-flex align-items-center gap-1 mt-1">
                               <span class="x-small fw-700 text-muted">{{ alert.description || 'Requiere revisión' }}</span>
                            </div>
                         </div>
                         <span class="badge-status-neon mini" 
                               [class.expired]="alert.type === 'EXPIRED'"
                               [class.expiring]="alert.type === 'EXPIRING_SOON'"
                               [class.low-stock]="alert.type === 'LOW_STOCK'"
                               [class.critical-stock]="alert.type === 'CRITICAL_STOCK' || alert.type === 'BELOW_MIN'"
                               [class.overstock]="alert.type === 'OVERSTOCK'">
                            {{ getAlertLabel(alert.type) }}
                         </span>
                      </div>
                      
                      <div class="d-flex align-items-center gap-2 mt-2">
                         <div class="stat-pill" [class.danger]="alert.type === 'OVERSTOCK'">
                            <iconify-icon [icon]="alert.type === 'OVERSTOCK' ? 'solar:box-minimalistic-bold' : 'solar:box-bold-duotone'" width="12"></iconify-icon>
                            <span>Stock: {{ alert.stock }}</span>
                         </div>
                         
                         @if (alert.daysRemaining !== undefined) {
                            <div class="stat-pill" [class.danger]="alert.type === 'EXPIRED'">
                               <iconify-icon icon="solar:calendar-date-bold-duotone" width="12"></iconify-icon>
                               <span>{{ alert.daysRemaining < 0 ? 'Vencido' : alert.daysRemaining + 'd' }}</span>
                            </div>
                         }
                      </div>
                   </div>
                </div>
             </div>
          }
       </div>

       <div class="drawer-footer p-4 bg-white border-top mt-auto">
          <button class="btn btn-blue-beast w-100 rounded-pill py-2 shadow-blue" (click)="goToInventory()">
             <iconify-icon icon="solar:eye-scan-bold" class="me-2"></iconify-icon>
             Ver Todos los Productos Críticos
          </button>
       </div>
    </div>

    <!-- Placeholder to keep the space while sidebar is fixed/floating -->
    <div class="sidebar-spacer" [class.collapsed]="isActuallyCollapsed()"></div>
  `,
  styles: [`
    /* Drawer Styles */
    .notif-drawer-overlay {
       position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
       backdrop-filter: blur(8px); z-index: 2000;
       transition: all 0.3s; opacity: 0; visibility: hidden;
       &.show { opacity: 1; visibility: visible; }
    }
    .notif-drawer {
       position: fixed; top: 0; left: -420px; width: 400px; height: 100vh;
       background: #ffffff; z-index: 2100;
       transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
       display: flex; flex-direction: column;
       border-right: 1px solid #f1f5f9;
       &.show { left: 0; }
    }
    
    .icon-pulse {
       width: 48px; height: 48px; border-radius: 14px;
       display: flex; align-items: center; justify-content: center;
       background: #fffafa; color: #f97316;
    }

    .alert-item {
       background: #f8fafc;
       border: 1px solid #f1f5f9;
       cursor: pointer;
       transition: all 0.2s;
       &:hover { transform: translateX(8px); background: #ffffff; border-color: #3b82f6; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }
       
       &.critical { border-left: 4px solid #ef4444; background: #fff1f2; }
       &.overstock-row { border-left: 4px solid #0ea5e9; background: #f0f9ff; }
    }

    .product-thumb {
       width: 55px; height: 55px; border-radius: 10px; overflow: hidden; background: white;
       border: 1px solid #f1f5f9;
       img { width: 100%; height: 100%; object-fit: cover; }
    }

    .product-name { font-size: 0.95rem; color: #1e293b; max-width: 170px; }

    .stat-pill {
       display: flex; align-items: center; gap: 4px;
       padding: 2px 8px; background: #ffffff; border-radius: 6px;
       font-size: 10px; font-weight: 700; color: #64748b; border: 1px solid #e2e8f0;
       &.danger { color: #ef4444; border-color: #fecaca; }
    }

    .badge-status-neon.mini {
       font-size: 8px; padding: 2px 6px;
       &.expired { background: #fee2e2; color: #ef4444; }
       &.expiring { background: #ffedd5; color: #f59e0b; }
       &.low-stock { background: #fef9c3; color: #854d0e; }
       &.critical-stock { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
       &.overstock { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    }

    .btn-close-drawer { border: none; background: transparent; color: #94a3b8; transition: all 0.2s; &:hover { color: #ef4444; transform: rotate(90deg); } }

    /* Rest of sidebar... */
    .sidebar { width: 260px; height: 100vh; background: #ffffff; color: #333; display: flex; flex-direction: column; transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s; border-right: 1px solid #f1f5f9; position: fixed; left: 0; top: 0; z-index: 1000; }
    .sidebar.collapsed { width: 70px; }
    .sidebar-header { height: 70px; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #f8fafc; overflow: hidden; }
    .logo-container { display: flex; align-items: center; gap: 10px; flex: 1; }
    .logo-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
    .title { font-weight: 800; font-size: 1.25rem; color: #1e3a8a; letter-spacing: -0.5px; }
    .toggle-btn { color: #64748b; }
    .sidebar.collapsed .toggle-btn { margin: 0 auto; }
    .nav-list { padding: 10px 0; }
    .nav-list a { margin: 4px 10px; border-radius: 12px; color: #64748b; height: 48px; }
    .nav-list a.active { background: #f0f7ff; color: #3b82f6; }
    .nav-list a.active iconify-icon { color: #3b82f6; }
    .spacer { flex: 1; }
    .user-profile { padding: 15px; margin: 10px; background: #f8fafc; border-radius: 16px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
    .avatar-circle { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; }
    .avatar-img-sidebar { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
    .user-details { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .user-details .name { font-weight: 700; font-size: 0.85rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-details .role { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
    .logout-btn { color: #94a3b8; }
    .logout-btn:hover { color: #ef4444; background: #fee2e2; }
    .sidebar-spacer { width: 260px; height: 100vh; flex-shrink: 0; transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
    .sidebar-spacer.collapsed { width: 70px; }

    .fw-800 { font-weight: 800; }
    .x-small { font-size: 11px; }
    .scroll-styled { overflow-y: auto; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } }
    .shadow-soft { box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }
    .shadow-blue { box-shadow: 0 10px 20px -5px rgba(30, 64, 175, 0.3); }
    .btn-blue-beast { background: #1e40af; color: white; border: none; font-weight: 700; transition: all 0.2s; }
    .btn-blue-beast:hover { background: #1e3a8a; transform: translateY(-2px); }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public notificationService = inject(NotificationService);

  collapsed = signal(false);
  isHovered = signal(false);

  Math = Math;

  user = computed(() => this.authService.currentUser());

  isActuallyCollapsed = computed(() => {
    return this.collapsed() && !this.isHovered();
  });

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleCollapse(event: Event) {
    event.stopPropagation();
    this.collapsed.update((v) => !v);
  }

  getAlertLabel(type: string): string {
    switch(type) {
      case 'EXPIRED': return 'CADUCADO';
      case 'EXPIRING_SOON': return 'POR VENCER';
      case 'LOW_STOCK': return 'STOCK BAJO';
      case 'CRITICAL_STOCK': return 'CRÍTICO';
      case 'BELOW_MIN': return 'BAJO MÍNIMO';
      case 'OVERSTOCK': return 'EXCESO STOCK';
      default: return 'ALERTA';
    }
  }

  viewInInventory(productId: number) {
     this.notificationService.showDrawer.set(false);
     this.router.navigate(['/products'], { 
        queryParams: { id: productId },
        queryParamsHandling: 'merge' 
     });
  }

  goToInventory() {
    this.notificationService.showDrawer.set(false);
    this.router.navigate(['/products'], { 
       queryParams: { filter: 'critical' },
       queryParamsHandling: 'merge'
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}