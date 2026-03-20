import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface SystemSettings {
  id?: number;
  expirationThreshold: number;
  criticalStockThreshold: number;
  regularStockThreshold: number;
  autoNotifyLogin: boolean;
  preventExpiredSale: boolean;
  systemCurrency: string;
  systemName: string;
  systemLogo: string | null;
  companyNit: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings`;
  private readonly STORAGE_KEY = 'pharma-system-settings';

  private defaultSettings: SystemSettings = {
    expirationThreshold: 30,
    criticalStockThreshold: 10,
    regularStockThreshold: 40,
    autoNotifyLogin: true,
    preventExpiredSale: true,
    systemCurrency: 'COP',
    systemName: 'PharmaSpring Pro',
    systemLogo: null,
    companyNit: '901.123.456-7'
  };

  // Signal reactivo para que todo el sistema se entere de los cambios
  private settingsSignal = signal<SystemSettings>(this.loadCache() || this.defaultSettings);
  
  // Computeds para fácil acceso desde componentes
  public currentSettings = computed(() => this.settingsSignal());

  constructor() {
    // 🔥 Al iniciar, sincronizamos con la Base de Datos (PostgreSQL)
    this.fetchSettings();
  }

  // 📡 Traer de la Base de Datos (PostgreSQL)
  fetchSettings() {
    console.log('📡 Sincronizando identidad con PostgreSQL...');
    this.http.get<SystemSettings>(this.apiUrl).subscribe({
      next: (dbSettings) => {
        console.log('✅ Identidad recuperada del servidor:', dbSettings.systemName);
        const merged = { ...this.defaultSettings, ...dbSettings };
        this.settingsSignal.set(merged);
        this.saveCache(merged);
      },
      error: (err) => {
        console.warn('⚠️ No se pudo conectar con el servidor, usando respaldo local.', err.status);
        // El signal ya tiene el valor del cache local por la inicialización
      }
    });
  }

  // 📡 Guardar en la Base de Datos (PostgreSQL)
  updateSettings(newSettings: SystemSettings) {
    console.log('💾 Guardando cambios en PostgreSQL...');
    const settingsToSave = { ...newSettings, id: 1 };
    
    return this.http.put<SystemSettings>(this.apiUrl, settingsToSave).pipe(
      tap(savedSettings => {
        console.log('✅ Cambios grabados a fuego en DB');
        this.settingsSignal.set(savedSettings);
        this.saveCache(savedSettings);
      })
    ).subscribe({
      error: (err) => console.error('🚫 Falla crítica al guardar en PostgreSQL:', err)
    });
  }

  // ── Cache Local (Failsafe) ────────────────────────
  private loadCache(): SystemSettings | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.STORAGE_KEY + '_backup');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }

  private saveCache(settings: SystemSettings) {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      localStorage.setItem(this.STORAGE_KEY + '_backup', serialized);
    } catch { /* Quota exceeded or similar */ }
  }

  get settings() {
    return this.settingsSignal();
  }

  // 🧪 Lógica de Estado de Stock (Semáforo)
  getStockStatus(stock: number): 'CRITICAL' | 'REGULAR' | 'GOOD' {
    const { criticalStockThreshold, regularStockThreshold } = this.settings;
    if (stock <= criticalStockThreshold) return 'CRITICAL';
    if (stock <= regularStockThreshold) return 'REGULAR';
    return 'GOOD';
  }

  // 🧪 Lógica de Vencimiento
  isExpiringSoon(expirationDate: string | Date | null): boolean {
    if (!expirationDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= this.settings.expirationThreshold;
  }

  isExpired(expirationDate: string | Date | null): boolean {
    if (!expirationDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    return exp < today;
  }
}
