import { Component, OnInit, inject, signal, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupplierService } from '../../../core/services/supplier';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './suppliers-list.html',
  styleUrls: ['./suppliers-list.scss'],
})
export class SuppliersList implements OnInit {
  private supplierService = inject(SupplierService);

  suppliers = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading = signal(true);
  searchTerm = '';
  skeletonRows = Array(6).fill({});

  // Modal
  showModal = signal(false);
  modalMode = signal<'create' | 'edit' | 'view'>('create');
  editingId: number | null = null;
  form: any = { name: '', email: '', phone: '', address: '', descriptionSupplier: '', status: 'active' };

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.supplierService.getAll().subscribe({
      next: (data) => {
        this.suppliers.set(Array.isArray(data) ? data : (data as any)?.content || []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filtered.set(
      term
        ? this.suppliers().filter(s =>
            s.name?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.phone?.includes(term) ||
            (s.descriptionSupplier || s.description_supplier)?.toLowerCase().includes(term))
        : this.suppliers()
    );
  }

  openCreate() {
    this.modalMode.set('create');
    this.editingId = null;
    this.form = { name: '', email: '', phone: '', address: '', descriptionSupplier: '', status: 'active' };
    this.showModal.set(true);
  }

  openEdit(sup: any) {
    this.modalMode.set('edit');
    this.editingId = sup.id;
    this.form = { name: sup.name, email: sup.email || '', phone: sup.phone || '', address: sup.address || '', descriptionSupplier: sup.descriptionSupplier || sup.description_supplier || '', status: sup.status || 'active' };
    this.showModal.set(true);
  }

  openView(sup: any) {
    this.modalMode.set('view');
    this.form = { ...sup, descriptionSupplier: sup.descriptionSupplier || sup.description_supplier };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name?.trim()) return;
    const obs = this.modalMode() === 'create'
      ? this.supplierService.create(this.form)
      : this.supplierService.update(this.editingId!, this.form);

    obs.subscribe({
      next: () => {
        Swal.fire({ title: this.modalMode() === 'create' ? '¡Proveedor creado!' : '¡Proveedor actualizado!', icon: 'success', confirmButtonColor: '#1e3a8a', timer: 1800, showConfirmButton: false });
        this.closeModal(); this.loadData();
      },
      error: () => Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.', icon: 'error', confirmButtonColor: '#1e3a8a' })
    });
  }

  delete(sup: any) {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `"${sup.name}" será eliminado del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(res => {
      if (!res.isConfirmed) return;
      this.supplierService.delete(sup.id).subscribe({
        next: () => { Swal.fire({ title: 'Eliminado', icon: 'success', confirmButtonColor: '#1e3a8a', timer: 1500, showConfirmButton: false }); this.loadData(); },
        error: () => Swal.fire({ title: 'Error', text: 'No se pudo eliminar.', icon: 'error', confirmButtonColor: '#1e3a8a' })
      });
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getSupplierColor(index: number): string {
    const colors = ['#f59e0b','#06b6d4','#8b5cf6','#10b981','#3b82f6','#ef4444','#ec4899'];
    return colors[index % colors.length];
  }

  @HostListener('keydown.escape') onEsc() { this.closeModal(); }
}
