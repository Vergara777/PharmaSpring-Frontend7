import { Component, OnInit, inject, signal, computed, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryService } from '../../../core/services/category';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './categories-list.html',
  styleUrls: ['./categories-list.scss'],
})
export class CategoriesList implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading = signal(true);
  searchTerm = '';
  skeletonRows = Array(5).fill({});

  // Modal state
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingId: number | null = null;
  form = { name: '', descripcion: '', status: 'active' };

  activeCount = computed(() => this.categories().filter(c => c.status === 'active').length);
  inactiveCount = computed(() => this.categories().filter(c => c.status === 'inactive').length);

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
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
        ? this.categories().filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.descripcion?.toLowerCase().includes(term))
        : this.categories()
    );
  }

  openCreate() {
    this.modalMode.set('create');
    this.editingId = null;
    this.form = { name: '', descripcion: '', status: 'active' };
    this.showModal.set(true);
  }

  openEdit(cat: any) {
    this.modalMode.set('edit');
    this.editingId = cat.id;
    this.form = { name: cat.name, descripcion: cat.descripcion || '', status: cat.status || 'active' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) return;
    const obs = this.modalMode() === 'create'
      ? this.categoryService.create(this.form)
      : this.categoryService.update(this.editingId!, this.form);

    obs.subscribe({
      next: () => {
        Swal.fire({ title: this.modalMode() === 'create' ? '¡Categoría creada!' : '¡Categoría actualizada!', icon: 'success', confirmButtonColor: '#1e3a8a', timer: 1800, showConfirmButton: false });
        this.closeModal();
        this.loadData();
      },
      error: () => Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.', icon: 'error', confirmButtonColor: '#1e3a8a' })
    });
  }

  delete(cat: any) {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `"${cat.name}" será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(res => {
      if (!res.isConfirmed) return;
      this.categoryService.delete(cat.id).subscribe({
        next: () => { Swal.fire({ title: 'Eliminada', icon: 'success', confirmButtonColor: '#1e3a8a', timer: 1500, showConfirmButton: false }); this.loadData(); },
        error: () => Swal.fire({ title: 'Error', text: 'No se pudo eliminar.', icon: 'error', confirmButtonColor: '#1e3a8a' })
      });
    });
  }

  getCategoryIcon(name: string): string {
    const map: Record<string, string> = {
      'antibióticos': 'bi-bandaid-fill', 'analgésicos': 'bi-thermometer-half',
      'vitaminas': 'bi-brightness-high-fill', 'cuidado facial': 'bi-droplet-fill',
    };
    return map[name?.toLowerCase()] || 'bi-grid-fill';
  }

  getCategoryColor(index: number): string {
    const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
    return colors[index % colors.length];
  }

  @HostListener('keydown.escape') onEsc() { this.closeModal(); }
}
