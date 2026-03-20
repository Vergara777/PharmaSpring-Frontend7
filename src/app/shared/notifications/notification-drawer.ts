import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { MatIconModule } from '@angular/material/icon';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="drawer-overlay" *ngIf="notificationService.showDrawer()" (click)="closeDrawer()" [@fadeInOut]></div>
    <div class="drawer-panel" [class.open]="notificationService.showDrawer()">
      <div class="drawer-header">
        <div class="header-title">
          <mat-icon>notifications_active</mat-icon>
          <h2>Centro de Alertas</h2>
        </div>
        <button class="close-btn" (click)="closeDrawer()"><mat-icon>close</mat-icon></button>
      </div>
      
      <div class="drawer-content">
        @if (notificationService.loading()) {
          <div class="loading-state">
            <mat-icon class="spin">sync</mat-icon>
            <p>Sincronizando el inventario...</p>
          </div>
        } @else if (notificationService.alerts().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-shield">
              <mat-icon>check_circle_outline</mat-icon>
            </div>
            <h3>¡Todo Perfecto!</h3>
            <p>No tienes productos próximos a vencer ni stock en niveles críticos. Has hecho un gran trabajo.</p>
          </div>
        } @else {
          <div class="alerts-list">
            @for (alert of notificationService.alerts(); track alert.id) {
              <!-- TARJETA CLICLEABLE -->
              <div class="alert-card" [ngClass]="alert.importance.toLowerCase()" (click)="goToProduct(alert.id)" title="Ver producto">
                <div class="indicator"></div>
                <div class="alert-image">
                  <img [src]="alert.image" [alt]="alert.name" onerror="this.src='/assets/images/placeholder.png'" />
                </div>
                <div class="alert-details">
                  <h4>{{ alert.name }}</h4>
                  <p class="description">{{ alert.description }}</p>
                  <p class="stock-info">Stock actual: <strong>{{ alert.stock }}</strong> unidades</p>
                </div>
                <mat-icon class="go-icon">chevron_right</mat-icon>
              </div>
            }
          </div>
        }
      </div>

      <!-- BOTÓN VER TODO -->
      <div class="drawer-footer" *ngIf="notificationService.alerts().length > 0">
        <button class="view-all-btn" (click)="viewAllIssues()">
          <mat-icon>manage_search</mat-icon>
          Revisar Problemas en Inventario
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* SOMBRAS Y FONDOS SUAVIZADOS (MINIMALISTAS) */
    .drawer-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.25);
      z-index: 2000;
      backdrop-filter: blur(1.5px); /* Menos agresivo */
    }
    .drawer-panel {
      position: fixed;
      top: 0; right: -450px;
      width: 420px;
      height: 100vh;
      background: #ffffff;
      box-shadow: -5px 0 25px rgba(0, 0, 0, 0.08); /* Sombra mucho más suave */
      z-index: 2001;
      display: flex;
      flex-direction: column;
      transition: right 0.4s ease-out;
    }
    .drawer-panel.open { right: 0; }
    
    .drawer-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .header-title h2 { margin: 0; font-size: 19px; font-weight: 700; color: #1e293b; letter-spacing: -0.3px;}
    .header-title mat-icon { color: #3b82f6; width: 24px; height: 24px; font-size: 24px; }
    
    .close-btn {
      background: transparent; border: none; cursor: pointer;
      color: #94a3b8; padding: 6px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .close-btn:hover { background: #f1f5f9; color: #1e293b; }
    
    .drawer-content {
      flex: 1; overflow-y: auto; padding: 20px;
      background: #f8fafc; /* Fondo gris súper claro, descansa la vista */
    }
    
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon-shield { width: 80px; height: 80px; background: #f0fdf4; color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid #bbf7d0;}
    .empty-icon-shield mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state h3 { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px;}
    .empty-state p { color: #64748b; font-size: 14.5px; line-height: 1.5;}
    
    .loading-state { text-align: center; padding: 80px 0; color: #3b82f6; }
    .spin { animation: rotation 1.2s infinite linear; font-size: 36px; width: 36px; height: 36px; }
    .loading-state p { margin-top: 15px; font-weight: 500; color: #64748b;}
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(359deg); } }
    
    .alerts-list { display: flex; flex-direction: column; gap: 12px; }
    
    /* TARJETAS MÁS LIMPIAS Y CLICLEABLES */
    .alert-card {
      display: flex; background: #ffffff; border-radius: 10px;
      border: 1px solid #e2e8f0; padding: 14px;
      position: relative; overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;
      align-items: center; /* Alineado al centro para el chevron */
    }
    .alert-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px -3px rgba(0,0,0,0.08); border-color: #cbd5e1; }
    
    .indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .alert-card.high .indicator { background: #ef4444; }
    .alert-card.medium .indicator { background: #f59e0b; }
    .alert-card.info .indicator { background: #3b82f6; }
    
    .alert-image { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; margin-right: 14px; flex-shrink: 0; border: 1px solid #f1f5f9; background: #ffffff; display: flex; align-items: center; justify-content: center; }
    .alert-image img { width: 100%; height: 100%; object-fit: contain; padding: 2px;}
    
    .alert-details { flex: 1; min-width: 0; }
    .alert-details h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
    .description { margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: 500; }
    .stock-info { margin: 0; font-size: 12px; color: #94a3b8; }
    .stock-info strong { color: #334155; font-weight: 700; }
    
    .alert-card.high .description { color: #dc2626; }
    .alert-card.medium .description { color: #d97706; }
    .alert-card.info .description { color: #2563eb; font-weight: 700; }

    /* FLECHA INDICADORA AL HOVER */
    .go-icon { color: #cbd5e1; transition: color 0.2s; margin-left: 8px;}
    .alert-card:hover .go-icon { color: #3b82f6; }

    /* FOOTER Y BOTÓN VER TODO */
    .drawer-footer {
      padding: 16px 24px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
    }
    .view-all-btn {
      width: 100%;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .view-all-btn mat-icon { font-size: 20px; width: 20px; height: 20px;}
    .view-all-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('0.3s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('0.3s ease-in', style({ opacity: 0 }))])
    ])
  ]
})
export class NotificationDrawerComponent {
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  closeDrawer() {
    this.notificationService.showDrawer.set(false);
  }

  // 🚀 REDIRIGIR A UN PRODUCTO ESPECÍFICO
  goToProduct(productId: number) {
    this.closeDrawer();
    this.router.navigate(['/products'], { queryParams: { id: productId } });
  }

  // 🚀 REDIRIGIR PARA VER TODOS LOS PROBLEMAS
  viewAllIssues() {
    this.closeDrawer();
    this.router.navigate(['/products'], { queryParams: { filter: 'issues' } });
  }
}
