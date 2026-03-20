import { Component, signal, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { SettingsService, SystemSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  
  // ── Estados de Configuración ──────────────────────
  loading = signal(false);
  isSaving = signal(false);

  // ── Parámetros de Alertas (Días para vencimiento) ──
  config: SystemSettings = { ...this.settingsService.settings };

  ngOnInit() {
    this.config = { ...this.settingsService.settings };
  }

  saveSettings() {
    this.isSaving.set(true);
    
    // Simular guardado con delay premium
    setTimeout(() => {
      this.settingsService.updateSettings(this.config);
      this.isSaving.set(false);
      
      Swal.fire({
        title: '¡Configuración Guardada!',
        text: 'Los parámetros del sistema se han actualizado correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#fff',
        color: '#1e293b'
      });
    }, 800);
  }

  resetSettings() {
    Swal.fire({
      title: '¿Restablecer valores?',
      text: 'Se volverá a la configuración de fábrica del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('pharma-system-settings');
        location.reload();
      }
    });
  }
}
