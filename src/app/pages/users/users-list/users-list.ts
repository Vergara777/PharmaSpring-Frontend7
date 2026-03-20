import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users-list',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.scss'],
})
export class UsersList implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading = signal(true);
  searchTerm = '';
  roleFilter: 'ALL' | 'ADMIN' | 'EMPLEADO' = 'ALL';
  skeletonRows = Array(6).fill({});

  modalMode = signal<'create' | 'edit' | 'view'>('create');
  editingId: number | null = null;

  showModal = signal(false);
  showPassword = false;
  avatarPreview = signal<string | null>(null);
  isDragOver = false;

  form: any = {
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'EMPLEADO',
    status: 'active',
    documentType: 'CC',
    documentNumber: '',
    birthDate: '',
    hireDate: '',
    position: '',
    avatar: '',
  };

  readonly DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'TI', 'PP', 'DIE'];
  readonly ROLES = ['ADMIN', 'EMPLEADO'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(Array.isArray(data) ? data : (data as any)?.content || []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    let result = this.users();
    const term = this.searchTerm.toLowerCase();
    
    // Filtro por término de búsqueda
    if (term) {
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) || // CamelCase fix
          u.last_name?.toLowerCase().includes(term) || // SnakeCase support
          u.email?.toLowerCase().includes(term) ||
          u.documentNumber?.includes(term) || // CamelCase fix
          u.document_number?.includes(term) || // SnakeCase support
          u.position?.toLowerCase().includes(term)
      );
    }

    // Filtro por Rol (Súper robosto)
    if (this.roleFilter !== 'ALL') {
      result = result.filter((u) => {
        const role = (u.role || '').toUpperCase();
        if (this.roleFilter === 'ADMIN') {
          return role === 'ADMIN' || role === 'ADMINISTRADOR';
        } else if (this.roleFilter === 'EMPLEADO') {
          return role === 'EMPLEADO' || role === 'TRABAJADOR' || role === 'USER';
        }
        return false;
      });
    }
    
    this.filtered.set(result);
  }

  setRoleFilter(role: 'ALL' | 'ADMIN' | 'EMPLEADO') {
    this.roleFilter = role;
    this.applyFilter();
  }

  private emptyForm() {
    return {
      name: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'EMPLEADO',
      status: 'active',
      documentType: 'CC',
      documentNumber: '',
      birthDate: '',
      hireDate: '',
      position: '',
      avatar: '',
    };
  }

  openCreate() {
    this.modalMode.set('create');
    this.editingId = null;
    this.showPassword = false;
    this.avatarPreview.set(null);
    this.form = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(user: any) {
    this.modalMode.set('edit');
    this.editingId = user.id;
    this.showPassword = false;
    this.avatarPreview.set(user.avatar || null);
    this.form = {
      name: user.name || '',
      lastName: user.lastName || user.last_name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'EMPLEADO',
      status: user.status || 'active',
      documentType: user.documentType || user.document_type || 'CC',
      documentNumber: user.documentNumber || user.document_number || '',
      birthDate: user.birthDate || user.birth_date || '',
      hireDate: user.hireDate || user.hire_date || '',
      position: user.position || '',
      avatar: user.avatar || '',
    };
    this.showModal.set(true);
  }

  openView(user: any) {
    this.modalMode.set('view');
    this.avatarPreview.set(user.avatar || null);
    this.form = { ...user, lastName: user.lastName || user.last_name, documentNumber: user.documentNumber || user.document_number };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.avatarPreview.set(null);
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.readFile(file);
  }

  onAvatarDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.readFile(file);
  }

  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.avatarPreview.set(base64);
      this.form.avatar = base64;
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarPreview.set(null);
    this.form.avatar = '';
  }

  /** Returns the photo URL or null (for *ngIf check) */
  getUserPhoto(user: any): string | null {
    return user?.avatar && user.avatar.trim() ? user.avatar : null;
  }

  save() {
    if (!this.form.name?.trim() || !this.form.email?.trim()) return;
    const payload: any = { ...this.form };
    if (!payload.password) delete payload.password;

    const obs =
      this.modalMode() === 'create'
        ? this.userService.create(payload)
        : this.userService.update(this.editingId!, payload);

    obs.subscribe({
      next: (res: any) => {
        // Si el usuario actualizado es el mismo que está logueado, actualizamos el servicio de auth
        const cur = this.authService.getUser();
        if (cur && cur.id === res.id) {
          this.authService.updateUser(res);
        }

        Swal.fire({
          title: this.modalMode() === 'create' ? '¡Usuario creado!' : '¡Usuario actualizado!',
          icon: 'success',
          confirmButtonColor: '#1e3a8a',
          timer: 1800,
          showConfirmButton: false,
        });
        this.closeModal();
        this.loadData();
      },
      error: () =>
        Swal.fire({
          title: 'Error',
          text: 'No se pudo completar la operación.',
          icon: 'error',
          confirmButtonColor: '#1e3a8a',
        }),
    });
  }

  delete(user: any) {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `"${user.name} ${user.last_name || ''}" será eliminado del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.userService.delete(user.id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Eliminado',
            icon: 'success',
            confirmButtonColor: '#1e3a8a',
            timer: 1500,
            showConfirmButton: false,
          });
          this.loadData();
        },
        error: () =>
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar.',
            icon: 'error',
            confirmButtonColor: '#1e3a8a',
          }),
      });
    });
  }

  getRoleBadge(role: string) {
    if (role === 'ADMIN' || role === 'ADMINISTRADOR')
      return { label: 'Administrador', class: 'role-admin' };
    return { label: 'Empleado', class: 'role-emp' };
  }

  getInitials(name: string, lastName?: string): string {
    const first = (name || ' ')[0] || '';
    const last = (lastName || name?.split(' ')[1] || ' ')[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    let hash = 0;
    for (const ch of name || '') hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getStatusLabel(status: string) {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  get adminCount() {
    return this.users().filter((u) => u.role === 'ADMIN' || u.role === 'ADMINISTRADOR').length;
  }
  get empCount() {
    return this.users().filter((u) => u.role !== 'ADMIN' && u.role !== 'ADMINISTRADOR').length;
  }
  get activeCount() {
    return this.users().filter((u) => u.status === 'active').length;
  }

  @HostListener('keydown.escape') onEsc() {
    this.closeModal();
  }
}
