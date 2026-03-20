import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductService } from '../core/services/product';
import { AuthService } from '../core/services/auth';
import { SettingsService } from './settings.service';
import Swal from 'sweetalert2';

export interface AlertItem {
  id: number;
  name: string;
  image: string;
  stock: number;
  status: string;
  expiresAt?: string;
  daysRemaining?: number;
  type: 'EXPIRED' | 'EXPIRING_SOON' | 'LOW_STOCK' | 'CRITICAL_STOCK' | 'OVERSTOCK' | 'BELOW_MIN';
  importance: 'HIGH' | 'MEDIUM' | 'INFO';
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private settingsService = inject(SettingsService);

  private allAlerts = signal<AlertItem[]>([]);
  public showDrawer = signal(false);
  loading = signal(false);
  private lastTotalCount = 0;

  expiredCount = computed(() => this.allAlerts().filter(a => a.type === 'EXPIRED').length);
  criticalStockCount = computed(() => this.allAlerts().filter(a => a.type === 'CRITICAL_STOCK' || a.type === 'BELOW_MIN').length);
  redAlertsCount = computed(() => this.allAlerts().filter(a => a.importance === 'HIGH').length);
  
  totalAlerts = computed(() => this.allAlerts().length);
  alerts = computed(() => this.allAlerts());

  constructor() {
    // Solo refrescar si ya estamos logueados (evita el 403 en el login)
    if (this.authService.isLoggedIn()) {
      this.refreshAlerts();
    }
  }

  toggleDrawer() {
    this.showDrawer.update(v => !v);
  }

  openDrawer() {
    this.showDrawer.set(true);
    this.refreshAlerts();
  }

  refreshAlerts() {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (products: any[]) => {
        const { expirationThreshold, criticalStockThreshold, regularStockThreshold } = this.settingsService.settings;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const newAlerts: AlertItem[] = [];

        products.forEach(p => {
           const stock = parseInt(p.stock) || 0;
           const image = p.image || 'assets/images/default-product.png';
           const expDateStr = p.expires_at || p.expiresAt;
           const status = p.status || 'Active';
           const minLimit = p.mim_stock ?? p.minStock ?? p.min_stock ?? 0;
           const maxLimit = p.max_stock ?? p.maxStock ?? 0;

           if (expDateStr) {
              const expDate = new Date(expDateStr);
              const diffTime = expDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (expDate < today) {
                 newAlerts.push({ 
                    id: p.id, name: p.name, image, stock, status,
                    expiresAt: expDateStr, daysRemaining: diffDays, 
                    type: 'EXPIRED', importance: 'HIGH', description: 'Producto ya caducado'
                 });
              } else if (diffDays <= expirationThreshold) {
                 newAlerts.push({ 
                    id: p.id, name: p.name, image, stock, status,
                    expiresAt: expDateStr, daysRemaining: diffDays, 
                    type: 'EXPIRING_SOON', importance: 'MEDIUM', description: `Vence en ${diffDays} días`
                 });
              }
           }

           if (stock === 0) {
              newAlerts.push({ 
                 id: p.id, name: p.name, image, stock, status,
                 type: 'CRITICAL_STOCK', importance: 'HIGH', description: 'Sin existencias (0)'
              });
           } else if (minLimit > 0 && stock < minLimit) {
              newAlerts.push({ 
                 id: p.id, name: p.name, image, stock, status,
                 type: 'BELOW_MIN', importance: 'HIGH', description: `Bajo el mínimo (${minLimit})`
              });
           } else if (stock <= criticalStockThreshold) {
              newAlerts.push({ 
                 id: p.id, name: p.name, image, stock, status,
                 type: 'CRITICAL_STOCK', importance: 'HIGH', description: 'Nivel crítico global'
              });
           } else if (stock <= regularStockThreshold) {
              newAlerts.push({ 
                 id: p.id, name: p.name, image, stock, status,
                 type: 'LOW_STOCK', importance: 'MEDIUM', description: 'Reponer pronto'
              });
           }

           if (maxLimit > 0 && stock > maxLimit) {
              newAlerts.push({ 
                 id: p.id, name: p.name, image, stock, status,
                 type: 'OVERSTOCK', importance: 'INFO', description: `Excede el máximo (${maxLimit})`
              });
           }
        });

        const sorted = newAlerts.sort((a,b) => {
           const priority = { HIGH: 0, MEDIUM: 1, INFO: 2 };
           return priority[a.importance] - priority[b.importance];
        });

        this.allAlerts.set(sorted);
        
        // Mantengo lógica de contar TODO pero vuelvo al diseño original (blanco)
        if (sorted.length > 0 && sorted.length !== this.lastTotalCount) {
           this.showToast(sorted.length);
        }
        this.lastTotalCount = sorted.length;

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private showToast(count: number) {
     const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        background: '#ffffff',
        color: '#1e293b',
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
     });

     Toast.fire({
        icon: 'warning',
        iconColor: '#ef4444',
        title: 'Atención de Inventario',
        text: `Hay ${count} alertas activas. Revisa el almacén.`,
        customClass: {
           popup: 'shadow-2xl rounded-4'
        }
     });
  }
}
