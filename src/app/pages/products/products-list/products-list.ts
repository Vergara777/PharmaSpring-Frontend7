import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { SettingsService } from '../../../services/settings.service';
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
  styleUrls: ['./products-list.scss'],
})
export class ProductsList implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── Data ────────────────────────────────────────────
  products: any[] = [];
  categories: any[] = [];
  searchTerm = '';
  selectedCategory: any = null;
  statusFilter: 'all' | 'in_stock' | 'out_of_stock' | 'critical' = 'all';
  loading = signal(true);
  skeletonRows = Array(6).fill({});
  filteredProducts = signal<any[]>([]);
  sortKey = signal<string>('id');
  sortDirection = signal<'asc' | 'desc'>('desc');
  showPageSizeMenu = signal(false);

  // ── Cart System ───────────────────────────────────────
  cartItems = signal<any[]>([]);
  showCartDrawer = signal(false);

  addToCart(product: any) {
    const items = [...this.cartItems()];
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
      this.cartItems.set(items);
    } else {
      this.cartItems.set([...items, { ...product, quantity: 1 }]);
    }
  }

  removeFromCart(productId: number) {
    this.cartItems.set(this.cartItems().filter((i) => i.id !== productId));
  }

  cartTotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.price_unit * item.quantity, 0),
  );

  totalCartItems = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  // ── Pagination ────────────────────────────────────────
  pageSizeOptions = [5, 10, 25, 50, 100];
  pageSize = signal(10);
  currentPage = signal(1);

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize())),
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, start + 5);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // ── Column visibility (Signal) ────────────────────────
  private getDefaultColumns(): ColumnDef[] {
    return [
      { key: 'product', label: 'Producto', visible: true },
      { key: 'sku', label: 'SKU', visible: true },
      { key: 'category', label: 'Categoría', visible: true },
      { key: 'stock', label: 'Stock', visible: true },
      { key: 'price', label: 'Precio', visible: true },
      { key: 'cost', label: 'Costo', visible: false },
      { key: 'mim_stock', label: 'Stock Mín.', visible: false },
      { key: 'max_stock', label: 'Stock Máx.', visible: false },
      { key: 'priceUnit', label: 'Precio Unidad', visible: true },
      { key: 'pricePackage', label: 'Precio Paquete', visible: true },
      { key: 'shelf', label: 'Estante', visible: false },
      { key: 'shelf_row', label: 'Fila', visible: false },
      { key: 'shelf_position', label: 'Posición', visible: false },
      { key: 'expiration', label: 'Vencimiento', visible: false },
    ];
  }

  private getInitialColumns(): ColumnDef[] {
    const stored = localStorage.getItem('pharma-products-cols');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Borrar definitivamente el status para que no salga
        return parsed.filter((c: any) => c.key !== 'status');
      } catch (e) {}
    }
    return this.getDefaultColumns();
  }

  columns = signal<ColumnDef[]>(this.getInitialColumns());

  private saveColumnsState(cols: ColumnDef[]) {
    localStorage.setItem('pharma-products-cols', JSON.stringify(cols));
  }

  visibleColumns = computed(() =>
    this.columns()
      .filter((c) => c.visible)
      .map((c) => c.key),
  );

  get allSelected(): boolean {
    return this.columns().every((c) => c.visible);
  }

  // ── UI Toggles ────────────────────────────────────────
  showColumnMenu = false;
  showCategoryMenu = false;
  openActionRowId: number | null = null;
  hoverRowId: number | null = null;
  actionMenuStyle: { top: string; left: string } = { top: '0px', left: '0px' };

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
       if (params['id']) {
          this.searchTerm = `ID:${params['id']}`;
       }
       if (params['filter'] === 'critical') {
          this.statusFilter = 'critical';
          sessionStorage.setItem('productStatusFilter', 'critical');
       }
       this.loadData();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.col-menu-wrapper')) this.showColumnMenu = false;
    if (!target.closest('.category-menu-wrapper')) this.showCategoryMenu = false;
    if (!target.closest('.dropdown')) this.openActionRowId = null;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event?: any) {
    this.openActionRowId = null;
  }

  // ── Data Loading ──────────────────────────────────────
  loadData() {
    this.loading.set(true);
    forkJoin({
      products: this.productService.getAll(),
      categories: this.categoryService.getAll(),
    }).subscribe({
      next: ({ products, categories }) => {
        this.products = products;
        this.categories = categories;

        // Restore Session State
        const savedSort = sessionStorage.getItem('productSortKey');
        const savedDir = sessionStorage.getItem('productSortDir') as 'asc' | 'desc';
        const savedStatus = sessionStorage.getItem('productStatusFilter') as any;
        const savedPageSize = sessionStorage.getItem('productPageSize');

        if (savedSort) this.sortKey.set(savedSort);
        if (savedDir) this.sortDirection.set(savedDir);
        if (savedStatus) this.statusFilter = savedStatus;
        if (savedPageSize) this.pageSize.set(Number(savedPageSize));

        this.filterProducts();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterProducts() {
    let results = this.products.filter((p) => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        (term.startsWith('id:') && p.id.toString() === term.replace('id:', ''));
      
      const matchCat = !this.selectedCategory || p.categoryId === this.selectedCategory;
      const { criticalStockThreshold, regularStockThreshold } = this.settingsService.settings;
      let matchStatus = true;
      if (this.statusFilter === 'in_stock') matchStatus = p.stock > regularStockThreshold;
      if (this.statusFilter === 'out_of_stock') matchStatus = p.stock === 0;
      if (this.statusFilter === 'critical') matchStatus = p.stock > 0 && p.stock <= regularStockThreshold;
      return matchSearch && matchCat && matchStatus;
    });

    // ── Apply Sorting ──
    const key = this.sortKey();
    const dir = this.sortDirection();
    results.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      // Handle special fields
      if (key === 'category') {
        valA = a.categoryName;
        valB = b.categoryName;
      }
      if (key === 'expiration') {
        valA = a.expiration_date;
        valB = b.expiration_date;
      }

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      const order = dir === 'asc' ? 1 : -1;
      return valA < valB ? -order : order;
    });

    this.filteredProducts.set(results);
    this.currentPage.set(1); // always reset to page 1 on filter change
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.selectedCategory = null;
    
    sessionStorage.removeItem('productStatusFilter');
    
    // Limpiar también los parámetros de la URL
    this.router.navigate([], { 
       queryParams: { id: null, filter: null }, 
       queryParamsHandling: 'merge' 
    });

    this.filterProducts();
  }

  toggleSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }

    // Save sort state to SessionStorage
    sessionStorage.setItem('productSortKey', this.sortKey());
    sessionStorage.setItem('productSortDir', this.sortDirection());

    this.filterProducts();
  }

  setStatusFilter(val: 'all' | 'in_stock' | 'out_of_stock' | 'critical') {
    this.statusFilter = val;
    sessionStorage.setItem('productStatusFilter', val);
    this.filterProducts();
  }

  selectCategory(id: number | null) {
    this.selectedCategory = id;
    this.showCategoryMenu = false;
    this.filterProducts();
  }

  getCategoryNameById(id: number | null): string {
    if (id === null) return 'Categorías';
    return this.categories.find((c) => c.id === id)?.name || 'Categorías';
  }

  // ── Pagination helpers ────────────────────────────
  goToPage(n: number) {
    if (n >= 1 && n <= this.totalPages()) this.currentPage.set(n);
  }
  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }
  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }
  onPageSizeChange(size: string | number) {
    const val = Number(size);
    this.pageSize.set(val);
    sessionStorage.setItem('productPageSize', val.toString());
    this.currentPage.set(1);
  }

  // ── Column Menu ───────────────────────────────────────
  toggleColumnMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showColumnMenu = !this.showColumnMenu;
  }

  toggleSelectAll(checked: boolean) {
    this.columns.update((cols) => {
      const newCols = cols.map((c) => ({ ...c, visible: checked }));
      this.saveColumnsState(newCols);
      return newCols;
    });
  }

  toggleColumn(key: string, checked: boolean) {
    this.columns.update((cols) => {
      const newCols = cols.map((c) => (c.key === key ? { ...c, visible: checked } : c));
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
      top: `${btn.bottom + 6}px`,
      left: `${btn.right - 172}px`,
    };
    this.openActionRowId = productId;
  }

  // ── Stock Helpers ─────────────────────────────────────
  getStockStatus(p: any): string {
    if (this.isOverstock(p)) return 'text-info';
    const status = this.settingsService.getStockStatus(p.stock);
    if (status === 'CRITICAL') return 'text-danger';
    if (status === 'REGULAR') return 'text-warning';
    return 'text-success';
  }

  getStockLabel(p: any): string {
    if (this.isOverstock(p)) return 'Exceso Stock';
    const status = this.settingsService.getStockStatus(p.stock);
    if (status === 'CRITICAL') return p.stock === 0 ? 'Agotado' : 'Crítico';
    if (status === 'REGULAR') return 'Stock Bajo';
    return 'Óptimo';
  }

  isOverstock(p: any): boolean {
    const maxLimit = p.max_stock ?? p.maxStock ?? 0;
    return maxLimit > 0 && p.stock > maxLimit;
  }

  getStockProgress(p: any): number {
    return Math.min((p.stock / 200) * 100, 100);
  }

  // ── Category Color ────────────────────────────────────
  getCategoryColor(name: string): string {
    const map: Record<string, string> = {
      Antibióticos: '#ef4444',
      Analgésicos: '#3b82f6',
      Vitaminas: '#f59e0b',
      'Cuidado Facial': '#ec4899',
    };
    return map[name] || '#404040';
  }

  // ── Modal / CRUD ──────────────────────────────────────
  openProductModal(mode: 'create' | 'edit' | 'view', product?: any) {
    this.openActionRowId = null;
    const ref = this.dialog.open(ProductModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      data: { mode, product },
      panelClass: 'premium-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = {
        id: result.id,
        sku: result.sku,
        name: result.name,
        descripcion: result.descripcion,
        image: result.image,
        price: result.price,
        stock: result.stock,
        categoryId: result.category_id,
        supplierId: result.supplier_id,
        expirationDate: this.formatDate(result.expiration_date),
        expiresAt: this.formatDate(result.expires_at) || this.formatDate(result.expiration_date),
        shelf: result.shelf,
        row: result.shelf_row,
        position: result.shelf_position,
        status: result.status,
        cost: result.cost,
        minStock: result.mim_stock,
        maxStock: result.max_stock,
        unitName: result.unit_name,
        packageName: result.package_name,
        unitsPerPackage: result.units_per_package,
        priceUnit: result.price_unit,
        pricePackage: result.price_package,
      };
      const obs =
        mode === 'create'
          ? this.productService.create(payload)
          : this.productService.update(product.id, payload);

      obs.subscribe({
        next: () => {
          Swal.fire({
            title: mode === 'create' ? '¡Creado!' : '¡Actualizado!',
            text:
              mode === 'create'
                ? 'Producto registrado con éxito.'
                : 'Cambios guardados correctamente.',
            icon: 'success',
            confirmButtonColor: '#1e3a8a',
          });
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
    });
  }

  deleteProduct(product: any) {
    this.openActionRowId = null;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${product.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Eliminado',
            text: 'El producto ha sido borrado.',
            icon: 'success',
            confirmButtonColor: '#1e3a8a',
          });
          this.loadData();
        },
        error: () =>
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al eliminar.',
            icon: 'error',
            confirmButtonColor: '#1e3a8a',
          }),
      });
    });
  }

  confirmDelete(product: any) {
    this.deleteProduct(product);
  }

  getProductById(id: number): any {
    return this.filteredProducts().find((p: any) => p.id === id) ?? null;
  }

  isExpiringSoon(dateStr: string): boolean {
    return this.settingsService.isExpiringSoon(dateStr);
  }

  isExpired(dateStr: string): boolean {
    return this.settingsService.isExpired(dateStr);
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
