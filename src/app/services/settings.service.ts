import { Injectable, signal, computed } from '@angular/core';

export interface SystemSettings {
  expirationThreshold: number;
  criticalStockThreshold: number;
  regularStockThreshold: number;
  autoNotifyLogin: boolean;
  preventExpiredSale: boolean;
  systemCurrency: string;
  companyName: string;
  companyNit: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'pharma-system-settings';

  private defaultSettings: SystemSettings = {
    expirationThreshold: 30,
    criticalStockThreshold: 10,
    regularStockThreshold: 40,
    autoNotifyLogin: true,
    preventExpiredSale: true,
    systemCurrency: 'COP',
    companyName: 'PharmaSys Professional',
    companyNit: '901.123.456-7'
  };

  // Signal reactivo para que todo el sistema se entere de los cambios
  private settingsSignal = signal<SystemSettings>(this.loadSettings());
  
  // Computeds para fácil acceso desde componentes
  public currentSettings = computed(() => this.settingsSignal());

  constructor() {}

  private loadSettings(): SystemSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : this.defaultSettings;
  }

  get settings() {
    return this.settingsSignal();
  }

  updateSettings(newSettings: SystemSettings) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    this.settingsSignal.set(newSettings);
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
