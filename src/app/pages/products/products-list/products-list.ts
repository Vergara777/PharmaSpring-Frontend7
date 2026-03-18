import {
  Component, OnInit, inject, signal, computed, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../../core/services/product';
import { CategoryService } from '../../../core/services/category';
import { ProductModalComponent } from '../product-modal/product-modal';
import Swal from 'sweetalert2';

export interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss']
})
export class ProductsList implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  // ── Data ────────────────────────────────────────────
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  searchTerm = '';
  selectedCategory: any = null;
  statusFilter: 'all' | 'in_stock' | 'out_of_stock' | 'critical' = 'all';
  loading = signal(true);
  skeletonRows = Array(6).fill({});

  // ── Pagination ────────────────────────────────────────
  pageSizeOptions = [5, 10, 25, 50, 100];
  pageSize    = signal(10);
  currentPage = signal(1);

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts.slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize()))
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, start + 5);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // ── Stats ────────────────────────────────────────────
  lowStockCount  = 0;
  outOfStockCount = 0;


  // ── Column visibility (Signal) ────────────────────────
  private getDefaultColumns(): ColumnDef[] {
    return [
      { key: 'product',    label: 'Producto',      visible: true  },
      { key: 'sku',        label: 'SKU',           visible: true  },
      { key: 'category',   label: 'Categoría',     visible: true  },
      { key: 'stock',      label: 'Stock',         visible: true  },
      { key: 'price',      label: 'Precio',        visible: true  },
      { key: 'status',     label: 'Estado',        visible: true  },
      { key: 'cost',       label: 'Costo',         visible: false },
      { key: 'minStock',   label: 'Stock Mín.',    visible: false },
      { key: 'maxStock',   label: 'Stock Máx.',    visible: false },
      { key: 'priceUnit',  label: 'Precio Unidad', visible: false },
      { key: 'pricePkg',   label: 'Precio Paquete',visible: false },
      { key: 'laboratory', label: 'Laboratorio',   visible: false },
      { key: 'expiration', label: 'Vencimiento',   visible: false },
    ];
  }

  private getInitialColumns(): ColumnDef[] {
    const stored = localStorage.getItem('pharma-products-cols');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return this.getDefaultColumns();
  }

  columns = signal<ColumnDef[]>(this.getInitialColumns());

  private saveColumnsState(cols: ColumnDef[]) {
    localStorage.setItem('pharma-products-cols', JSON.stringify(cols));
  }

  visibleColumns = computed(() =>
    this.columns().filter(c => c.visible).map(c => c.key)
  );

  get allSelected(): boolean {
    return this.columns().every(c => c.visible);
  }

  // ── UI Toggles ────────────────────────────────────────
  showColumnMenu = false;
  openActionRowId: number | null = null;
  actionMenuStyle: { top: string; left: string } = { top: '0px', left: '0px' };

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit() { this.loadData(); }

  // ── Host Listener ─────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.col-menu-wrapper')) this.showColumnMenu = false;
    if (!target.closest('.action-menu-wrapper')) this.openActionRowId = null;
  }

  // ── Data Loading ──────────────────────────────────────
  loadData() {
    this.loading.set(true);
    setTimeout(() => {
      forkJoin({
        products: this.productService.getAll(),
        categories: this.categoryService.getAll()
      }).subscribe({
        next: ({ products, categories }) => {
          this.products = products;
          this.categories = categories;
          this.filteredProducts = [...products];
          this.calculateStats();
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }, 1200);
  }

  calculateStats() {
    this.lowStockCount  = this.products.filter(p => p.stock > 0 && p.stock <= 40).length;
    this.outOfStockCount = this.products.filter(p => p.stock === 0).length;
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term);
      const matchCat = !this.selectedCategory || p.categoryId === this.selectedCategory;
      let matchStatus = true;
      if (this.statusFilter === 'in_stock')    matchStatus = p.stock > 40;
      if (this.statusFilter === 'out_of_stock') matchStatus = p.stock === 0;
      if (this.statusFilter === 'critical')    matchStatus = p.stock > 0 && p.stock <= 40;
      return matchSearch && matchCat && matchStatus;
    });
    this.currentPage.set(1); // always reset to page 1 on filter change
  }

  setStatusFilter(val: 'all' | 'in_stock' | 'out_of_stock' | 'critical') {
    this.statusFilter = val;
    this.filterProducts();
  }

  // ── Pagination helpers ────────────────────────────
  goToPage(n: number) {
    if (n >= 1 && n <= this.totalPages()) this.currentPage.set(n);
  }
  nextPage() { this.goToPage(this.currentPage() + 1); }
  prevPage() { this.goToPage(this.currentPage() - 1); }
  onPageSizeChange(size: number) {
    this.pageSize.set(+size);
    this.currentPage.set(1);
  }


  // ── Column Menu ───────────────────────────────────────
  toggleColumnMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showColumnMenu = !this.showColumnMenu;
  }

  toggleSelectAll(checked: boolean) {
    this.columns.update(cols => {
      const newCols = cols.map(c => ({ ...c, visible: checked }));
      this.saveColumnsState(newCols);
      return newCols;
    });
  }

  toggleColumn(key: string, checked: boolean) {
    this.columns.update(cols => {
      const newCols = cols.map(c => c.key === key ? { ...c, visible: checked } : c);
      this.saveColumnsState(newCols);
      return newCols;
    });
  }

  // ── Action Menu (3-dots) ──────────────────────────────
  toggleActionMenu(event: MouseEvent, productId: number) {
    event.stopPropagation();
    if (this.openActionRowId === productId) {
      this.openActionRowId = null;
      return;
    }
    // Use fixed viewport coords so menu is never clipped by overflow:auto
    const btn = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.actionMenuStyle = {
      top:  `${btn.bottom + 6}px`,
      left: `${btn.right - 172}px`,
    };
    this.openActionRowId = productId;
  }

  // ── Stock Helpers ─────────────────────────────────────
  getStockStatus(p: any): 'critical' | 'low' | 'optimum' {
    if (p.stock === 0)    return 'critical';
    if (p.stock <= 40)    return 'low';
    return 'optimum';
  }

  getStockLabel(p: any): string {
    if (p.stock === 0)  return 'Agotado';
    if (p.stock <= 40)  return 'Stock Bajo';
    return 'Óptimo';
  }

  getStockProgress(p: any): number {
    return Math.min((p.stock / 200) * 100, 100);
  }

  // ── Category Color ────────────────────────────────────
  getCategoryColor(name: string): string {
    const map: Record<string, string> = {
      'Antibióticos': '#ef4444', 'Analgésicos': '#3b82f6',
      'Vitaminas': '#f59e0b',   'Cuidado Facial': '#ec4899',
    };
    return map[name] || '#404040';
  }

  // ── Modal / CRUD ──────────────────────────────────────
  openProductModal(mode: 'create' | 'edit' | 'view', product?: any) {
    this.openActionRowId = null;
    const ref = this.dialog.open(ProductModalComponent, {
      width: '700px',
      data: { mode, product },
      panelClass: 'premium-dialog'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const payload = {
        id: result.id, sku: result.sku, name: result.name,
        descripcion: result.descripcion, image: result.image,
        price: result.price, stock: result.stock,
        categoryId: result.category_id, supplierId: result.supplier_id,
        expirationDate: this.formatDate(result.expiration_date),
        expiresAt: this.formatDate(result.expires_at) || this.formatDate(result.expiration_date),
        shelf: result.shelf, row: result.shelf_row,
        position: result.shelf_position, status: result.status,
        cost: result.cost, minStock: result.mim_stock, maxStock: result.max_stock,
        unitName: result.unit_name, packageName: result.package_name,
        unitsPerPackage: result.units_per_package,
        priceUnit: result.price_unit, pricePackage: result.price_package,
      };
      const obs = mode === 'create'
        ? this.productService.create(payload)
        : this.productService.update(product.id, payload);

      obs.subscribe({
        next: () => {
          Swal.fire({ title: mode === 'create' ? '¡Creado!' : '¡Actualizado!',
            text: mode === 'create' ? 'Producto registrado con éxito.' : 'Cambios guardados correctamente.',
            icon: 'success', confirmButtonColor: '#1e3a8a' });
          this.loadData();
        },
        error: () => Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.',
          icon: 'error', confirmButtonColor: '#1e3a8a' })
      });
    });
  }

  deleteProduct(product: any) {
    this.openActionRowId = null;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${product.name}". Esta acción no se puede deshacer.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then(res => {
      if (!res.isConfirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => {
          Swal.fire({ title: 'Eliminado', text: 'El producto ha sido borrado.',
            icon: 'success', confirmButtonColor: '#1e3a8a' });
          this.loadData();
        },
        error: () => Swal.fire({ title: 'Error', text: 'Hubo un problema al eliminar.',
          icon: 'error', confirmButtonColor: '#1e3a8a' })
      });
    });
  }

  getProductById(id: number): any {
    return this.filteredProducts.find(p => p.id === id) ?? null;
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
