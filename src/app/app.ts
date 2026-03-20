import { Component, inject, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { AuthService } from './core/services/auth';
import { NotificationService } from './services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterOutlet, SidebarComponent, MatTooltipModule],
  template: `
    <div class="app-layout" *ngIf="isLoggedIn(); else publicLayout">
      <app-sidebar></app-sidebar>
      
      <div class="main-content">
        <!-- 🔔 Centro de Alertas Flotante Premium -->
        <div class="floating-header" *ngIf="isLoggedIn()">
           <div class="notif-pill shadow-lg" 
                [class.has-critical]="notificationService.redAlertsCount() > 0"
                [class.has-alerts]="notificationService.totalAlerts() > 0"
                [class.force-expanded]="isPillExpanded()"
                (click)="openAlerts()"
                matTooltip="Centro de Notificaciones">
              
              <div class="pill-content">
                <div class="bell-icon-container">
                   <iconify-icon icon="solar:bell-bing-bold-duotone" width="24"></iconify-icon>
                   @if (notificationService.totalAlerts() > 0) {
                     <span class="count-badge pulsate">{{ notificationService.totalAlerts() }}</span>
                   }
                </div>
                
                <div class="pill-info-container">
                   <div class="pill-info">
                      <span class="pill-text fw-800">
                         {{ notificationService.redAlertsCount() > 0 ? '¡ALERTA CRÍTICA!' : 'Aviso Pendiente' }}
                      </span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <router-outlet></router-outlet>
      </div>
    </div>

    <ng-template #publicLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f8fafc;
    }
    .main-content {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      position: relative;
    }

    /* ── Floating Header & Notification Pill ─────── */
    .floating-header {
       position: fixed;
       top: 25px;
       right: 35px;
       z-index: 1500;
       display: flex;
       align-items: center;
       pointer-events: none;
    }

    .notif-pill {
       pointer-events: auto;
       background: white;
       border-radius: 50px;
       display: flex;
       align-items: center;
       cursor: pointer;
       transition: all 0.75s cubic-bezier(0.19, 1, 0.22, 1);
       border: 1px solid #f1f5f9;
       box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08);
       overflow: hidden;
       width: 52px;
       height: 52px;
       justify-content: flex-start;

       &:hover {
          box-shadow: 0 15px 40px -8px rgba(0,0,0,0.12);
       }

       &.has-alerts {
          border-color: rgba(245, 158, 11, 0.3);
          .bell-icon-container { color: #f59e0b; }
          .pill-text { color: #f59e0b; }
       }

       &.has-critical {
          background: #fffafa;
          border-color: rgba(239, 68, 68, 0.4);
          animation: critical-glow 2.5s infinite;
          .bell-icon-container { color: #ef4444; }
          .pill-text { color: #ef4444; }
       }

       &.force-expanded {
          width: 300px;
          padding-right: 15px;
       }
    }

    .pill-content {
       display: flex;
       align-items: center;
       width: 100%;
       padding-left: 10px;
    }

    .pill-info-container {
       overflow: hidden;
       flex: 1;
       display: flex;
    }

    .pill-info {
       padding-left: 10px;
       white-space: nowrap;
       opacity: 1;
    }

    .bell-icon-container {
       position: relative;
       display: flex; align-items: center; justify-content: center;
       min-width: 32px; height: 32px;
    }

    .count-badge {
       position: absolute; top: -5px; right: -5px;
       background: #ef4444; color: white;
       font-size: 10px; font-weight: 900;
       width: 18px; height: 18px;
       border-radius: 50%;
       display: flex; align-items: center; justify-content: center;
       border: 2.5px solid white;
    }

    .pill-text {
       font-size: 10.5px;
       font-weight: 900;
       text-transform: uppercase;
       letter-spacing: 0.8px;
    }

    @keyframes critical-glow {
       0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.15), 0 10px 30px -5px rgba(0,0,0,0.08); }
       50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0), 0 15px 40px -8px rgba(0,0,0,0.12); }
       100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 10px 30px -5px rgba(0,0,0,0.08); }
    }

    .pulsate { animation: notif-pulse 2s infinite; }
    @keyframes notif-pulse {
       0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
       70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
       100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .fw-800 { font-weight: 800; }
  `]
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  isPillExpanded = signal(false);
  private hasAnnouncedAlert = false;

  constructor() {
    effect(() => {
      const count = this.notificationService.totalAlerts();
      if (count > 0 && !this.hasAnnouncedAlert) {
         this.hasAnnouncedAlert = true;
         this.isPillExpanded.set(true);
         setTimeout(() => {
            this.isPillExpanded.set(false);
         }, 5000);
      }
    });
  }

  ngOnInit() {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  openAlerts() {
    this.notificationService.openDrawer();
  }
}
