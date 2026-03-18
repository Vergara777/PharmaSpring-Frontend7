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
import Swal from 'sweetalert2';

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
            <mat-icon>medical_services</mat-icon>
          </div>
          
          <h1 class="hero-text">Tu salud, nuestra prioridad.</h1>
          <p class="hero-subtext">
            Accede a tu panel de salud personalizado, gestiona recetas, 
            y consulta con nuestros farmacéuticos expertos en un solo lugar seguro.
          </p>
          
          <footer class="visual-footer">
            <span>© 2026 PharmaSys Inc.</span>
            <span class="dot">•</span>
            <a href="#">Política de Privacidad</a>
            <span class="dot">•</span>
            <a href="#">Términos de Servicio</a>
          </footer>
        </div>
      </div>

      <!-- Right Side: Login Form -->
      <div class="form-side">
        <div class="login-box">
          <div class="login-header">
            <h2>Bienvenido de nuevo</h2>
            <p>Por favor, ingresa tus datos para iniciar sesión en tu cuenta.</p>
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      --primary-color: #1e40af; /* Deep blue from the image */
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
      background: rgba(30, 41, 59, 0.4); /* Dark slant overlay */
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
    .visual-footer a { color: white; text-decoration: none; }
    .visual-footer .dot { opacity: 0.5; }

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

    .login-header h2 {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 8px;
    }

    .login-header p {
      color: var(--text-muted);
      font-size: 16px;
      margin-bottom: 32px;
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
      margin-bottom: 2px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .forgot-link {
      font-size: 13px;
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }
    
    .forgot-link:hover {
      color: #1e40af;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .input-wrapper:focus-within {
      background: #ffffff;
      border-color: var(--primary-color);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08); /* Premium glow */
    }

    .prefix-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      font-size: 22px;
      width: 22px;
      height: 22px;
      transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .input-wrapper:focus-within .prefix-icon {
      color: var(--primary-color);
    }

    .suffix-icon {
      position: absolute;
      right: 14px;
      color: #94a3b8;
      font-size: 22px;
      width: 22px;
      height: 22px;
      cursor: pointer;
      transition: color 0.3s;
    }

    .suffix-icon:hover {
      color: var(--primary-color);
    }

    .custom-input {
      width: 100%;
      height: 52px;
      background: transparent;
      border: none;
      padding: 0 46px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-main);
      outline: none;
    }

    .custom-input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    .options-row {
      margin-top: -8px;
    }

    ::ng-deep .mat-mdc-checkbox label {
      font-size: 14px !important;
      color: var(--text-muted) !important;
    }

    .submit-btn {
      height: 52px;
      background: linear-gradient(135deg, #1e40af, #3b82f6) !important;
      color: white !important;
      border-radius: 12px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      margin-top: 12px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
    }
    
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
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
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
          role: res.role 
        });
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'El correo o la contraseña son incorrectos.',
          confirmButtonText: 'Intentar de nuevo',
          confirmButtonColor: '#1e40af',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-xl font-bold text-gray-800',
            confirmButton: 'rounded-lg font-semibold px-6 py-2'
          }
        });
      }
    });
  }
}