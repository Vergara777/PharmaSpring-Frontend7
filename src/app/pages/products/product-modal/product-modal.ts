import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../../core/services/category';
import { SupplierService } from '../../../core/services/supplier';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  template: `
    <div class="modal-wrapper">
      <!-- Header -->
      <div class="modal-header border-bottom px-4 py-3">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-badge" [ngClass]="data.mode">
            <i class="bi" [ngClass]="{
              'bi-plus-circle': data.mode === 'create',
              'bi-pencil-square': data.mode === 'edit',
              'bi-eye': data.mode === 'view'
            }"></i>
          </div>
          <div>
            <h5 class="modal-title mb-0 fw-bold">{{ getTitle() }}</h5>
            <small class="text-muted">{{ data.mode === 'view' ? 'Informacion del producto' : 'Completa los campos requeridos' }}</small>
          </div>
        </div>
        <button type="button" class="btn-close" (click)="close()"></button>
      </div>

      <!-- Body -->
      <div class="modal-body-scroll px-4 py-3">
        <div *ngIf="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-3 mb-0">Cargando informacion...</p>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="save()" *ngIf="!isLoading">
          <input type="hidden" formControlName="id">

          <!-- Image -->
          <div class="card bg-light border-0 mb-4">
            <div class="card-body d-flex align-items-center gap-3 py-3">
              <div class="img-preview rounded-3 border bg-white d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0">
                <img *ngIf="productForm.get('image')?.value" [src]="productForm.get('image')?.value" alt="Preview" class="w-100 h-100 object-fit-cover">
                <i *ngIf="!productForm.get('image')?.value" class="bi bi-image text-secondary" style="font-size: 2rem;"></i>
              </div>
              <div class="flex-grow-1">
                <label class="form-label fw-semibold small mb-1">URL de la Imagen</label>
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-link-45deg"></i></span>
                  <input type="text" class="form-control" formControlName="image" placeholder="https://ejemplo.com/producto.jpg">
                </div>
              </div>
            </div>
          </div>

          <!-- Informacion General -->
          <div class="section-label mb-3">
            <i class="bi bi-info-circle-fill text-primary me-2"></i>
            <span>Informacion General</span>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-12">
              <label class="form-label fw-semibold small">Nombre del Producto <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name" placeholder="Ej: Amoxicilina 500mg">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">SKU / Codigo <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="sku" placeholder="PRD-XXXX">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">Estado <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="status">
                <option value="active">Activo</option>
                <option value="retired">Retirado</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">Categoria <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="category_id">
                <option [ngValue]="null" disabled>Seleccionar...</option>
                <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">Proveedor <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="supplier_id">
                <option [ngValue]="null" disabled>Seleccionar...</option>
                <option *ngFor="let sup of suppliers" [ngValue]="sup.id">{{ sup.name }}</option>
              </select>
            </div>
          </div>

          <!-- Finanzas e Inventario -->
          <div class="section-label mb-3">
            <i class="bi bi-cash-stack text-primary me-2"></i>
            <span>Finanzas e Inventario</span>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Precio General <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-white">$</span>
                <input type="number" class="form-control" formControlName="price">
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Costo <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-white">$</span>
                <input type="number" class="form-control" formControlName="cost">
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Stock Actual <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="stock">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Stock Minimo</label>
              <input type="number" class="form-control" formControlName="mim_stock">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Stock Maximo</label>
              <input type="number" class="form-control" formControlName="max_stock">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Fecha Expiracion</label>
              <input type="date" class="form-control" formControlName="expires_at">
            </div>
          </div>
          <input type="hidden" formControlName="expiration_date">

          <!-- Logistica y Ubicacion -->
          <div class="section-label mb-3">
            <i class="bi bi-geo-alt-fill text-primary me-2"></i>
            <span>Logistica y Ubicacion</span>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Estante</label>
              <input type="text" class="form-control" formControlName="shelf">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Fila</label>
              <input type="text" class="form-control" formControlName="shelf_row">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Posicion</label>
              <input type="text" class="form-control" formControlName="shelf_position">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Empaque</label>
              <input type="text" class="form-control" formControlName="package_name" placeholder="Caja / Frasco">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Uds. por Empaque</label>
              <input type="number" class="form-control" formControlName="units_per_package">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold small">Nombre Unidad</label>
              <input type="text" class="form-control" formControlName="unit_name">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">Precio Empaque</label>
              <div class="input-group">
                <span class="input-group-text bg-white">$</span>
                <input type="number" class="form-control" formControlName="price_package">
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small">Precio Unitario</label>
              <div class="input-group">
                <span class="input-group-text bg-white">$</span>
                <input type="number" class="form-control" formControlName="price_unit">
              </div>
            </div>
          </div>

          <!-- Descripcion -->
          <div class="mb-3">
            <label class="form-label fw-semibold small">Descripcion / Notas adicionales</label>
            <textarea class="form-control" formControlName="descripcion" rows="3" placeholder="Notas sobre el producto..."></textarea>
          </div>

          <button type="submit" style="display: none;" [disabled]="productForm.invalid"></button>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer-bar px-4 py-3 border-top bg-light">
        <button type="button" class="btn btn-outline-secondary" (click)="close()">
          <i class="bi bi-x-lg me-1"></i> Cancelar
        </button>
        <button *ngIf="data.mode !== 'view'"
                type="button"
                class="btn btn-primary"
                (click)="save()"
                [disabled]="productForm.invalid || isLoading">
          <i class="bi me-1" [ngClass]="data.mode === 'create' ? 'bi-plus-lg' : 'bi-check-lg'"></i>
          {{ data.mode === 'create' ? 'Crear Producto' : 'Guardar Cambios' }}
        </button>
        <button *ngIf="data.mode === 'view'" type="button" class="btn btn-primary" (click)="close()">
          <i class="bi bi-check-lg me-1"></i> Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
    }

    .modal-header {
      flex-shrink: 0;
      background: #fff;
    }

    .icon-badge {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
    }
    .icon-badge.create { background: #d1fae5; color: #059669; }
    .icon-badge.edit { background: #dbeafe; color: #2563eb; }
    .icon-badge.view { background: #f1f5f9; color: #64748b; }

    .modal-body-scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .modal-body-scroll::-webkit-scrollbar { width: 6px; }
    .modal-body-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

    .img-preview {
      width: 80px; height: 80px;
    }

    .section-label {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e3a8a;
      padding-bottom: 8px;
      border-bottom: 2px solid #eff6ff;
    }

    .modal-footer-bar {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .form-control, .form-select {
      border-radius: 8px;
      border-color: #dee2e6;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
    }
    .form-control:focus, .form-select:focus {
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.2rem rgba(13,110,253,.15);
    }

    .input-group-text {
      border-radius: 8px 0 0 8px;
      border-color: #dee2e6;
      font-size: 0.875rem;
    }
    .input-group .form-control {
      border-radius: 0 8px 8px 0;
    }

    .btn {
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.5rem 1.25rem;
    }
    .btn-primary {
      background: #1e40af;
      border-color: #1e40af;
    }
    .btn-primary:hover {
      background: #1e3a8a;
      border-color: #1e3a8a;
    }
    .btn-primary:disabled {
      background: #93c5fd;
      border-color: #93c5fd;
    }
  `]
})
export class ProductModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  
  productForm: FormGroup;
  categories: any[] = [];
  suppliers: any[] = [];
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<ProductModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit' | 'view', product?: any }
  ) {
    this.productForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      sku: ['', Validators.required],
      descripcion: [''],
      status: ['active', Validators.required],
      category_id: [null, Validators.required],
      supplier_id: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      price_unit: [0, [Validators.min(0)]],
      price_package: [0, [Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      mim_stock: [0],
      max_stock: [0],
      expiration_date: [null],
      expires_at: [null],
      package_name: [''],
      unit_name: [''],
      units_per_package: [1],
      shelf: [''],
      shelf_row: [''],
      shelf_position: ['']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      categories: this.categoryService.getAll(),
      suppliers: this.supplierService.getAll()
    }).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.suppliers = res.suppliers;
        this.isLoading = false;
        
        if (this.data.product) {
          const p = this.data.product;
          this.productForm.patchValue({
            id: p.id,
            name: p.name,
            sku: p.sku,
            descripcion: p.descripcion || p.description,
            status: p.status || 'active',
            category_id: p.category_id || p.categoryId,
            supplier_id: p.supplier_id || p.supplierId,
            price: p.price || p.Price,
            price_unit: p.price_unit || p.priceUnit || 0,
            price_package: p.price_package || p.pricePackage || 0,
            cost: p.cost,
            stock: p.stock,
            image: p.image,
            mim_stock: p.mim_stock || p.mimStock || p.minStock || 0,
            max_stock: p.max_stock || p.maxStock || 0,
            expiration_date: p.expiration_date || p.expirationDate,
            expires_at: p.expires_at || p.expiresAt || p.expiration_date || p.expirationDate,
            package_name: p.package_name || p.packageName,
            unit_name: p.unit_name || p.unitName,
            units_per_package: p.units_per_package || p.unitsPerPackage || 1,
            shelf: p.shelf || '',
            shelf_row: p.shelf_row || p.shelfRow || p.row || '',
            shelf_position: p.shelf_position || p.shelfPosition || p.position || p.Position || ''
          });
          
          if (this.data.mode === 'view') {
            this.productForm.disable();
          }
        }
      },
      error: () => this.isLoading = false
    });
  }

  getTitle() {
    if (this.data.mode === 'create') return 'Añadir Producto';
    if (this.data.mode === 'edit') return 'Editar Producto';
    return 'Detalles del Producto';
  }

  getHeaderIcon() {
    if (this.data.mode === 'create') return 'add_shopping_cart';
    if (this.data.mode === 'edit') return 'edit';
    return 'inventory';
  }

  save() {
    if (this.productForm.valid) {
      this.dialogRef.close(this.productForm.value);
    }
  }

  close() { this.dialogRef.close(); }
}
