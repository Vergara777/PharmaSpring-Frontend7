import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout" *ngIf="isLoggedIn(); else publicLayout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
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
  `]
})
export class AppComponent {
  private authService = inject(AuthService);

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}

