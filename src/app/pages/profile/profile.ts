import { Component, OnInit, signal, inject, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { UserService } from '../../core/services/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  user = computed(() => this.authService.getUser());
  isEditing = signal(false);
  loading = signal(false);

  // Formulario reactivo simplificado
  form: any = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    documentNumber: '',
    position: '',
    avatar: ''
  };

  ngOnInit() {
    this.refreshFormData();
  }

  refreshFormData() {
    const u = this.user();
    if (u) {
      // Cargamos datos completos desde el backend para tener todo fresco
      this.userService.getById(u.id).subscribe({
        next: (fullUser) => {
          this.form = { ...fullUser };
        }
      });
    }
  }

  toggleEdit() {
    if (this.isEditing()) {
      this.refreshFormData(); // Cancelar cambios
    }
    this.isEditing.set(!this.isEditing());
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.form.avatar = e.target.result;
        // Si no estamos editando otros campos, guardamos la imagen de una vez
        if (!this.isEditing()) {
          this.saveProfile();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    const u = this.user();
    if (!u) return;

    this.loading.set(true);
    this.userService.update(u.id, this.form).subscribe({
      next: (updated) => {
        this.authService.updateUser(updated);
        this.isEditing.set(false);
        this.loading.set(false);
        
        Swal.fire({
          title: '¡Perfil Actualizado!',
          text: 'Tus cambios se han guardado correctamente.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      },
      error: () => {
        this.loading.set(false);
        Swal.fire('Error', 'No se pudo actualizar el perfil', 'error');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }
}
