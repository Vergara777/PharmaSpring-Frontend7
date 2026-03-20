import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';
import { SettingsService } from '../../../services/settings.service';
import Swal from 'sweetalert2';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <!-- Left Side: Visual Content -->
      <div class="visual-side">
        <div class="overlay"></div>
        <div class="visual-content">
          <div class="badge">
            @if (settingsService.currentSettings().systemLogo) {
               <img [src]="settingsService.currentSettings().systemLogo" style="width: 100%; height: 100%; object-fit: contain;" />
            } @else {
               <mat-icon>medical_services</mat-icon>
            }
          </div>
          
          <h1 class="hero-text">Tu salud, nuestra prioridad.</h1>
          <p class="hero-subtext">
            Accede a tu panel de salud personalizado, gestiona recetas, 
            y consulta con nuestros farmacéuticos expertos en un solo lugar seguro.
          </p>
          
          <footer class="visual-footer">
            <span>© 2026 {{ settingsService.currentSettings().systemName }}.</span>
          </footer>
        </div>
      </div>

      <!-- Right Side: Login Form -->
      <div class="form-side">
        <div class="login-box">
          <!-- Brand Identity Header - High Contrast Luxury Style -->
          <div class="brand-header">
            <div class="brand-logo-frame">
              @if (settingsService.currentSettings().systemLogo) {
                <img [src]="settingsService.currentSettings().systemLogo" alt="Logo" />
              } @else {
                <mat-icon>local_pharmacy</mat-icon>
              }
            </div>
            <h1 class="brand-name">{{ settingsService.currentSettings().systemName }}</h1>
          </div>

          <div class="login-header text-center">
            <h2>Acceso al Sistema</h2>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="auth-form">
            <div class="field-container">
              <label>Correo Electrónico</label>
              <div class="input-wrapper">
                <mat-icon class="prefix-icon">mail_outline</mat-icon>
                <input type="email" formControlName="email" placeholder="ejemplo@farmacia.com" class="custom-input">
              </div>
            </div>

            <div class="field-container">
              <label>Contraseña</label>
              <div class="input-wrapper">
                <mat-icon class="prefix-icon">lock_outline</mat-icon>
                <input [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Ingresa tu contraseña" class="custom-input">
                <mat-icon class="suffix-icon" (click)="hidePassword = !hidePassword">
                  {{ hidePassword ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </div>
            </div>

            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading">
              <span *ngIf="!loading">Iniciar Sesión</span>
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    :host {
      --primary-color: #1e40af;
      --text-main: #111827;
      --text-muted: #6b7280;
      --bg-light: #f9fafb;
      font-family: 'Inter', sans-serif;
    }

    .login-page {
      display: flex;
      height: 100vh;
      width: 100%;
      overflow: hidden;
    }

    /* LEFT SIDE */
    .visual-side {
      flex: 1;
      position: relative;
      background-image: url('/pharmacy_bg.png');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      padding: 60px;
    }

    .overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(30, 41, 59, 0.4);
    }

    .visual-content {
      position: relative;
      z-index: 2;
      max-width: 500px;
      color: white;
    }

    .badge {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      color: var(--primary-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .hero-text {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 20px;
      letter-spacing: -0.02em;
    }

    .hero-subtext {
      font-size: 16px;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .visual-footer {
      position: absolute;
      bottom: -150px;
      display: flex;
      gap: 12px;
      font-size: 13px;
      opacity: 0.7;
    }

    /* RIGHT SIDE */
    .form-side {
      width: 45%;
      background: var(--bg-light);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .login-box {
      width: 100%;
      max-width: 400px;
    }

    /* Brand Header - Supreme Circular Luxury Style */
    .brand-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 45px;
      animation: premium-reveal 1s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .brand-logo-frame {
      width: 120px;
      height: 120px;
      background: #ffffff; /* Fondo blanco por si el logo es transparente */
      border-radius: 50%; /* Perfect Circle */
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 
        0 15px 35px -5px rgba(15, 23, 42, 0.4),
        0 0 15px rgba(59, 130, 246, 0.3);
      border: 2px solid white; /* Borde súper fino */
      margin-bottom: 22px;
      overflow: hidden;
      transition: all 0.4s ease;
      cursor: pointer;
    }
    .brand-logo-frame:hover {
      transform: translateY(-5px) scale(1.05);
      border-color: #3b82f6;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.5), 0 0 25px rgba(59, 130, 246, 0.5);
    }
    .brand-logo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover; /* Llenar completamente el círculo */
      padding: 0; /* Cero margen interno, logo 100% de la bolita */
      border-radius: 50%;
    }
    .brand-logo-frame mat-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: #3b82f6;
    }
    .brand-name {
      font-size: 42px; /* Visibility Power! */
      font-weight: 1000;
      color: #0f172a;
      letter-spacing: -2.5px;
      margin: 0;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: block !important;
      visibility: visible !important;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
    }

    @keyframes premium-reveal {
      0% { transform: translateY(-30px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }

    .login-header h2 {
      font-size: 14px;
      font-weight: 800;
      color: #94a3b8;
      margin: 15px 0 40px;
      text-align: center;
      letter-spacing: 2.5px;
      text-transform: uppercase;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .field-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-container label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .input-wrapper:focus-within {
      background: #ffffff;
      border-color: var(--primary-color);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
    }

    .prefix-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
    }

    .suffix-icon {
      position: absolute;
      right: 14px;
      color: #ffffffff;
      cursor: pointer;
    }

    .custom-input {
      width: 100%;
      height: 52px;
      background: transparent;
      border: none;
      padding: 0 46px;
      font-size: 15px;
      outline: none;
    }

    .submit-btn {
      position: relative;
      height: 52px;
      background: linear-gradient(135deg, #1e40af, #3b82f6) !important;
      color: white !important;
      border-radius: 12px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      margin-top: 12px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
      z-index: 1;
    }

    /* 🪄 Efecto "Shine" (Destello de Cristal) */
    .submit-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transform: skewX(-25deg);
      transition: all 0.6s ease;
      z-index: -1;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-4px);
      box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.6);
    }

    /* Activación del destello en Hover */
    .submit-btn:hover:not([disabled])::before {
      left: 150%;
    }

    /* ⚪ Spinner Blanco Puro para Máxima Visibilidad */
    .submit-btn ::ng-deep .mat-mdc-progress-spinner circle,
    .submit-btn ::ng-deep circle {
      stroke: #ffffff !important;
    }

    @media (max-width: 900px) {
      .visual-side { display: none; }
      .form-side { width: 100%; }
    }
  `]
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public settingsService = inject(SettingsService);

  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (this.loginForm.invalid || this.loading) return;
    this.loading = true;

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.authService.saveToken(res.token, { 
          email: res.email, 
          name: res.name, 
          role: res.role,
          avatar: res.avatar,
          id: res.id
        });

        Swal.fire({
          title: `¡Bienvenid@, ${res.name}!`,
          timer: 1800,
          showConfirmButton: false,
          didOpen: () => {
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
              this.loading = false;
            }, 1800);
          }
        });
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'El correo o la contraseña son incorrectos.',
          confirmButtonColor: '#1e40af'
        });
      }
    });
  }
}