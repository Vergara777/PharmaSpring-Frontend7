import { Component, Inject, OnInit, signal, computed, inject, HostListener } from '@angular/core';
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
    <div class="modal-wrapper" [class.view-mode]="data.mode === 'view'">
      <!-- Header -->
      <div class="modal-header border-bottom px-4 py-3 sticky-top transition" [ngClass]="getHeaderStatusClass()">
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-badge" [ngClass]="data.mode">
              <i class="bi" [ngClass]="{
                'bi-plus-lg': data.mode === 'create',
                'bi-pencil-square': data.mode === 'edit',
                'bi-eye-fill': data.mode === 'view'
              }"></i>
            </div>
            <div>
              <h5 class="modal-title mb-0 fw-bold text-dark">{{ getTitle() }}</h5>
              <p class="text-muted small mb-0">{{ data.mode === 'view' ? 'Detalle completo del producto en sistema' : 'Por favor, completa la información técnica del producto' }}</p>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" (click)="close()"></button>
        </div>
      </div>

      <!-- Body -->
      <div class="modal-body-scroll px-4 py-4">
        <div *ngIf="isLoading" class="text-center py-5">
          <div class="spinner-grow text-primary" role="status"></div>
          <p class="text-muted mt-3 fw-medium">Cargando información del producto...</p>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="save()" *ngIf="!isLoading">
          <!-- View Mode Layout -->
          <ng-container *ngIf="data.mode === 'view'; else formFields">
            <div class="row g-4">
              <!-- Left Column: Image & Basic Info -->
              <div class="col-md-4">
                <div class="view-image-card shadow-sm rounded-4 overflow-hidden border bg-white mb-4">
                  <div class="aspect-ratio-box">
                    <img *ngIf="productForm.get('image')?.value" [src]="productForm.get('image')?.value" alt="Producto" class="w-100 h-100" style="object-fit: contain; padding: 1rem; background: #fff;">
                    <div *ngIf="!productForm.get('image')?.value" class="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-secondary">
                      <i class="bi bi-image" style="font-size: 3rem;"></i>
                      <span class="small fw-semibold mt-2">Sin Imagen</span>
                    </div>
                  </div>
                </div>

                <div class="info-group mb-3 text-center text-md-start">
                  <label class="info-label text-uppercase small fw-bold text-muted mb-1 d-block text-center text-md-start">SKU / Código</label>
                  <div class="info-value sku-pill">{{ productForm.get('sku')?.value || 'N/A' }}</div>
                </div>

                <div class="info-group mb-3 text-center text-md-start">
                  <label class="info-label text-uppercase small fw-bold text-muted mb-1 d-block text-center text-md-start">Estado</label>
                  <div class="info-value">
                    <span class="status-badge" [ngClass]="productForm.get('status')?.value">
                      <i class="bi bi-circle-fill me-2"></i>
                      {{ productForm.get('status')?.value === 'active' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right Column: Details Grid -->
              <div class="col-md-8">
                <div class="view-header mb-4 text-center text-md-start">
                  <!-- Badges de Estado del Producto -->
                  <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start mb-3" *ngIf="data.mode === 'view'">
                     <span class="badge bg-danger rounded-pill px-3 py-2 shadow-sm" *ngIf="isExpired()"><i class="bi bi-exclamation-octagon-fill me-1"></i> Producto Vencido</span>
                     <span class="badge bg-warning text-dark rounded-pill px-3 py-2 shadow-sm" *ngIf="!isExpired() && isExpiringSoon()"><i class="bi bi-clock-history me-1"></i> Por Vencer</span>
                     <span class="badge bg-danger rounded-pill px-3 py-2 shadow-sm" *ngIf="isStockCritical()"><i class="bi bi-arrow-down-circle-fill me-1"></i> Stock Crítico</span>
                     <span class="badge bg-info text-white rounded-pill px-3 py-2 shadow-sm" *ngIf="isOverstock()"><i class="bi bi-arrow-up-circle-fill me-1"></i> Exceso de Stock</span>
                  </div>
                  <h3 class="display-6 fw-bold text-primary mb-1">{{ productForm.get('name')?.value }}</h3>
                  <p class="text-secondary lead">{{ getCategoryName() }} | {{ getSupplierName() }}</p>
                </div>

                <div class="row g-3 mb-4">
                  <div class="col-md-4">
                    <div class="metric-card bg-light border-0 rounded-4 p-3 h-100 shadow-sm transition">
                      <div class="d-flex align-items-center gap-2 mb-2 text-primary">
                        <i class="bi bi-tag-fill"></i>
                        <span class="small fw-bold text-uppercase">PV Und.</span>
                      </div>
                      <div class="h5 fw-bold mb-0 text-dark">$ {{ productForm.get('price')?.value || '0' }}</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="metric-card bg-light border-0 rounded-4 p-3 h-100 shadow-sm transition">
                      <div class="d-flex align-items-center gap-2 mb-2 text-success">
                        <i class="bi bi-box-seam-fill"></i>
                        <span class="small fw-bold text-uppercase">PV Paquete</span>
                      </div>
                      <div class="h5 fw-bold mb-0 text-dark">$ {{ productForm.get('price_package')?.value || '0' }}</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="metric-card bg-light border-0 rounded-4 p-3 h-100 shadow-sm transition">
                      <div class="d-flex align-items-center gap-2 mb-2 text-secondary">
                        <i class="bi bi-layers-fill"></i>
                        <span class="small fw-bold text-uppercase">Stock Total</span>
                      </div>
                      <div class="h5 fw-bold mb-0" [ngClass]="getStockClass()">{{ productForm.get('stock')?.value }} Ud(s).</div>
                    </div>
                  </div>
                </div>

                <div class="view-section mb-4">
                  <h6 class="section-title border-bottom pb-2 mb-3 fw-bold text-uppercase small text-primary">
                    <i class="bi bi-lightning-fill text-warning me-2"></i>Logística y Ubicación
                  </h6>
                  <div class="row row-cols-2 g-3">
                    <div class="col">
                      <label class="info-label text-muted small d-block">Ubicación Fís.</label>
                      <span class="fw-semibold text-dark">E: {{ productForm.get('shelf')?.value || '-' }} | F: {{ productForm.get('shelf_row')?.value || '-' }} | P: {{ productForm.get('shelf_position')?.value || '-' }}</span>
                    </div>
                    <div class="col">
                      <label class="info-label text-muted small d-block">Umbrales Stock</label>
                      <span class="fw-semibold text-dark">Min: {{ productForm.get('mim_stock')?.value }} | Max: {{ productForm.get('max_stock')?.value }}</span>
                    </div>
                    <div class="col">
                      <label class="info-label text-muted small d-block">Presentación</label>
                      <span class="fw-semibold text-dark">{{ productForm.get('package_name')?.value || '-' }} ({{ productForm.get('units_per_package')?.value }} x {{ productForm.get('unit_name')?.value || 'und' }})</span>
                    </div>
                    <div class="col">
                      <label class="info-label text-muted small d-block">Fecha Exp.</label>
                      <span class="fw-semibold text-danger">{{ (productForm.get('expires_at')?.value | date:'dd MMM, yyyy') || 'N/A' }}</span>
                    </div>
                    <div class="col">
                      <label class="info-label text-muted small d-block">Costo Compra</label>
                      <span class="fw-semibold text-dark">$ {{ productForm.get('cost')?.value || '0' }}</span>
                    </div>
                  </div>
                </div>

                <div class="view-section">
                  <h6 class="section-title border-bottom pb-2 mb-3 fw-bold text-uppercase small text-primary">
                    <i class="bi bi-card-text me-2"></i>Descripción técnica
                  </h6>
                  <p class="text-secondary small-text mb-0">{{ productForm.get('descripcion')?.value || 'No hay descripción técnica registrada para este producto.' }}</p>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Edit/Create Mode Fields -->
          <ng-template #formFields>
            <div class="card border border-primary border-opacity-10 rounded-4 mb-4 shadow-sm overflow-hidden">
              <div class="card-body p-4 bg-light bg-opacity-25">
                <div class="row align-items-center">
                  <div class="col-md-auto text-center mb-3 mb-md-0">
                    <div class="img-upload-box rounded-circle border-4 border-white shadow-sm overflow-hidden mx-auto bg-white position-relative cursor-pointer hover-scale transition"
                         (click)="fileInput.click()">
                      <img *ngIf="productForm.get('image')?.value" [src]="productForm.get('image')?.value" class="w-100 h-100 object-fit-cover shadow-sm">
                      <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light" *ngIf="!productForm.get('image')?.value">
                        <i class="bi bi-camera-fill text-muted" style="font-size: 2rem;"></i>
                      </div>
                      <!-- Hidden File Input -->
                      <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" style="display: none;">
                      <div class="overlay-upload position-absolute bottom-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition">
                         <i class="bi bi-cloud-arrow-up-fill text-white h3"></i>
                      </div>
                    </div>
                  </div>
                  <div class="col">
                    <h6 class="fw-bold mb-1">Imagen del Producto</h6>
                    <p class="text-muted small mb-3">Haz clic en el círculo para subir desde tu PC o ingresa una URL manual.</p>
                    <div class="input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-link-45deg"></i></span>
                      <input type="text" class="form-control border-start-0 py-2" formControlName="image" placeholder="https://ejemplo.com/producto.jpg">
                      <button class="btn btn-outline-secondary px-3" type="button" (click)="fileInput.click()">
                        <i class="bi bi-folder2-open me-2"></i>Buscar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sections -->
            <div class="section-group mb-4">
              <h6 class="section-header fw-bold text-primary mb-3 d-flex align-items-center">
                <span class="badge bg-primary rounded-circle me-2 p-1 px-2" style="font-size: 0.7rem;">1</span> Datos Básicos
              </h6>
              <div class="row g-4 mb-4">
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted ps-1">Nombre del Producto</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-white border-end-0"><i class="bi bi-tag-fill text-primary"></i></span>
                    <input type="text" class="form-control border-start-0 py-2 rounded-end-4" formControlName="name" placeholder="Ej: Acetaminofén 500mg">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Código de Barras / SKU</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-primary border-primary border-end-0 text-white" matTooltip="Usa tu escáner físico">
                      <i class="bi bi-upc-scan fs-5"></i>
                    </span>
                    <input type="text" class="form-control border-primary border-start-0 py-2 rounded-end-4 fw-bold text-primary bg-light bg-opacity-10" formControlName="sku" placeholder="Haz clic y escanea el código...">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Estado comercial</label>
                  <div class="custom-select-wrapper">
                    <div class="custom-select-trigger" (click)="showStatusMenu = !showStatusMenu">
                      <span>{{ productForm.get('status')?.value === 'active' ? 'Activo' : 'Retirado' }}</span>
                      <i class="bi bi-chevron-down small text-muted"></i>
                    </div>
                    <div class="custom-select-menu" *ngIf="showStatusMenu">
                      <div class="custom-select-option" [class.selected]="productForm.get('status')?.value === 'active'" (click)="selectStatus('active')">
                        <span class="dot bg-success" style="width: 8px; height: 8px; border-radius: 50%;"></span> Activo
                      </div>
                      <div class="custom-select-option" [class.selected]="productForm.get('status')?.value === 'retired'" (click)="selectStatus('retired')">
                        <span class="dot bg-danger" style="width: 8px; height: 8px; border-radius: 50%;"></span> Retirado
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Categoría</label>
                  <div class="custom-select-wrapper">
                    <div class="custom-select-trigger" (click)="showCategoryMenu = !showCategoryMenu">
                      <span>{{ getCategoryName() }}</span>
                      <i class="bi bi-chevron-down small text-muted"></i>
                    </div>
                    <div class="custom-select-menu" *ngIf="showCategoryMenu">
                      <div class="custom-select-option" *ngFor="let cat of categories" 
                           [class.selected]="productForm.get('category_id')?.value === cat.id" (click)="selectCategory(cat)">
                        <i class="bi bi-bookmark-fill text-primary opacity-25"></i> {{ cat.name }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Proveedor / Lab.</label>
                  <div class="custom-select-wrapper">
                    <div class="custom-select-trigger" (click)="showSupplierMenu = !showSupplierMenu">
                      <span>{{ getSupplierName() }}</span>
                      <i class="bi bi-chevron-down small text-muted"></i>
                    </div>
                    <div class="custom-select-menu" *ngIf="showSupplierMenu">
                      <div class="custom-select-option" *ngFor="let sup of suppliers" 
                           [class.selected]="productForm.get('supplier_id')?.value === sup.id" (click)="selectSupplier(sup)">
                        <i class="bi bi-building-fill text-secondary opacity-25"></i> {{ sup.name }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section-group mb-4">
              <h6 class="section-header fw-bold text-success mb-3 d-flex align-items-center">
                <span class="badge bg-success rounded-circle me-2 p-1 px-2" style="font-size: 0.7rem;">2</span> Finanzas & Inventario
              </h6>
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label small fw-bold text-muted ps-1">Costo ($)</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-light px-2 border-end-0">$</span>
                    <input type="text" class="form-control border-start-0" formControlName="cost" (focus)="onFocusNumber('cost')" (blur)="onBlurCurrency('cost')" (input)="onInputCurrency($event, 'cost')">
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold text-muted ps-1">Venta Und.</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-white border-end-0 fw-bold text-primary">$</span>
                    <input type="text" class="form-control border-start-0" formControlName="price" (focus)="onFocusNumber('price')" (blur)="onBlurCurrency('price')" (input)="onInputCurrency($event, 'price')">
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold text-muted ps-1">Precio Unit.</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-white border-end-0 fw-bold text-info">$</span>
                    <input type="text" class="form-control border-start-0" formControlName="price_unit" (focus)="onFocusNumber('price_unit')" (blur)="onBlurCurrency('price_unit')" (input)="onInputCurrency($event, 'price_unit')">
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold text-muted ps-1">Venta Paq.</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-white border-end-0 fw-bold text-success">$</span>
                    <input type="text" class="form-control border-start-0" formControlName="price_package" (focus)="onFocusNumber('price_package')" (blur)="onBlurCurrency('price_package')" (input)="onInputCurrency($event, 'price_package')">
                  </div>
                </div>
                
                <div class="col-md-4">
                  <label class="form-label small fw-bold text-muted ps-1">Stock Actual</label>
                  <input type="text" class="form-control rounded-4 shadow-sm fw-bold border-2" formControlName="stock" [ngClass]="getStockClass()" (focus)="onFocusNumber('stock')" (blur)="onBlurNumber('stock')" (input)="onInputNumber($event, 'stock')">
                </div>
                <div class="col-md-12">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="form-check form-switch cursor-pointer">
                      <input class="form-check-input" type="checkbox" role="switch" id="stockSwitch" formControlName="useCustomStockLimit">
                      <label class="form-check-label small fw-bold text-muted" for="stockSwitch">¿Deseas personalizar los umbrales de stock?</label>
                    </div>
                  </div>
                  
                  <div class="row g-3 animate__animated animate__fadeIn" *ngIf="productForm.get('useCustomStockLimit')?.value">
                    <div class="col-md-6">
                      <label class="x-small fw-bold text-muted ps-1">Alerta Stock Bajo (Mínimo)</label>
                      <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-arrow-down-circle-fill text-danger"></i></span>
                        <input type="text" class="form-control border-start-0" formControlName="mim_stock" placeholder="Default: 5" (focus)="onFocusNumber('mim_stock')" (blur)="onBlurNumber('mim_stock')" (input)="onInputNumber($event, 'mim_stock')">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="x-small fw-bold text-muted ps-1">Alerta Sobre-stock (Máximo)</label>
                      <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-arrow-up-circle-fill text-info"></i></span>
                        <input type="text" class="form-control border-start-0" formControlName="max_stock" placeholder="Default: 100" (focus)="onFocusNumber('max_stock')" (blur)="onBlurNumber('max_stock')" (input)="onInputNumber($event, 'max_stock')">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Fecha de Vencimiento (Exp.)</label>
                  <div class="input-group shadow-sm">
                    <span class="input-group-text bg-white border-end-0"><i class="bi bi-calendar-check text-danger"></i></span>
                    <input type="date" class="form-control border-start-0" formControlName="expiration_date">
                  </div>
                </div>
              </div>
            </div>

            <div class="section-group">
              <h6 class="section-header fw-bold text-secondary mb-3 d-flex align-items-center">
                <span class="badge bg-secondary rounded-circle me-2 p-1 px-2" style="font-size: 0.7rem;">3</span> Logística & Almacén
              </h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label small fw-bold text-muted ps-1">Empaq. (Caja/Frasco)</label>
                  <input type="text" class="form-control rounded-3" formControlName="package_name">
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold text-muted ps-1">Uds/Pack</label>
                  <input type="text" class="form-control rounded-3" formControlName="units_per_package" (focus)="onFocusNumber('units_per_package')" (blur)="onBlurNumber('units_per_package')" (input)="onInputNumber($event, 'units_per_package')">
                </div>
                <div class="col-md-4">
                   <label class="form-label small fw-bold text-muted ps-1">Nombre Unidad (Tablet/Amp)</label>
                   <input type="text" class="form-control rounded-3" formControlName="unit_name" placeholder="Ej: Tabletas">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-muted ps-1">Ubicación Logística (E-F-P)</label>
                  <div class="row g-2">
                    <div class="col-4">
                      <div class="input-group input-group-sm shadow-sm" matTooltip="Estante">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-layers text-primary"></i></span>
                        <input type="text" class="form-control border-start-0 text-center fw-bold" formControlName="shelf" placeholder="Est.">
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="input-group input-group-sm shadow-sm" matTooltip="Fila">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-list-nested text-secondary"></i></span>
                        <input type="text" class="form-control border-start-0 text-center fw-bold" formControlName="shelf_row" placeholder="Fil.">
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="input-group input-group-sm shadow-sm" matTooltip="Posición">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-geo-fill text-danger"></i></span>
                        <input type="text" class="form-control border-start-0 text-center fw-bold" formControlName="shelf_position" placeholder="Pos.">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted ps-1">Descripción técnica</label>
                  <textarea class="form-control rounded-4 shadow-sm" rows="3" formControlName="descripcion" placeholder="Detalles técnicos..."></textarea>
                </div>
              </div>
            </div>

            <button type="submit" style="display: none;" [disabled]="productForm.invalid"></button>
          </ng-template>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-between align-items-center sticky-bottom rounded-bottom-4">
        <button type="button" class="btn btn-outline-secondary px-4 rounded-3 fw-semibold shadow-sm transition" (click)="close()">
          {{ data.mode === 'view' ? 'Volver' : 'Cancelar' }}
        </button>
        
        <div class="d-flex gap-2">
          <button *ngIf="data.mode !== 'view'"
                  type="button"
                  class="btn btn-primary px-5 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 transition"
                  (click)="save()"
                  [disabled]="productForm.invalid || isLoading">
            <i class="bi" [ngClass]="data.mode === 'create' ? 'bi-cloud-upload-fill' : 'bi-check-circle-fill'"></i>
            {{ data.mode === 'create' ? 'Crear Producto' : 'Guardar Cambios' }}
          </button>
          
          <button *ngIf="data.mode === 'view'" 
                  type="button" 
                  class="btn btn-dark px-5 rounded-3 fw-bold shadow transition" 
                  (click)="close()">
            Entendido
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; overflow: hidden; }
    
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      background: #fff;
      position: relative;
    }

    .modal-body-scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      background: #fdfdfd;
    }

    /* Premium View Mode */
    .view-mode .modal-body-scroll { background: #fff; }
    
    .status-header-expired { background-color: #fef2f2 !important; transition: background-color 0.3s ease; border-bottom-color: #fca5a5 !important; }
    .status-header-critical { background-color: #fff0f2 !important; transition: background-color 0.3s ease; border-bottom-color: #fecaca !important; }
    .status-header-expiring { background-color: #fffbeb !important; transition: background-color 0.3s ease; border-bottom-color: #fde68a !important; }
    .status-header-overstock { background-color: #f0fdf4 !important; transition: background-color 0.3s ease; border-bottom-color: #bbf7d0 !important; }
    
    .view-image-card {
      transition: all 0.3s ease;
      &:hover { transform: scale(1.02); }
    }
    
    .aspect-ratio-box {
      width: 100%;
      padding-top: 100%;
      position: relative;
    }
    .aspect-ratio-box img, .aspect-ratio-box div {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }

    .sku-pill {
      background: #f8fafc;
      color: #1e293b;
      font-family: 'Monaco', 'Consolas', monospace;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.95rem;
      border: 1px dashed #cbd5e1;
      display: inline-block;
      font-weight: 600;
      text-align: center;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 10px 20px;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.active { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .status-badge.retired { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .metric-card {
      transition: all 0.3s ease;
      &:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
    }

    .section-title {
      letter-spacing: 0.08em;
      font-size: 0.7rem;
      color: #1e40af;
    }

    /* Form Design */
    .img-upload-box {
      width: 120px;
      height: 120px;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #e2e8f0 !important;
    }

    .input-group { border-radius: 10px; overflow: hidden; }
    .input-group-text { border: 1px solid #e2e8f0; }

    .form-control, .form-select {
      border: 1px solid #e2e8f0;
      padding: 0.65rem 1rem;
      font-size: 0.925rem;
      transition: all 0.3s ease;
      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
      }
    }

    .icon-badge {
      width: 54px; height: 54px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }
    .icon-badge.create { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .icon-badge.edit { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
    .icon-badge.view { background: linear-gradient(135deg, #64748b, #475569); color: #fff; }

    .btn { padding: 0.75rem 1.5rem; transition: all 0.3s ease; }
    .btn-primary {
      background: #1e3a8a;
      border: none;
      &:hover { background: #1e40af; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
      &:disabled { opacity: 0.6; pointer-events: none; }
    }

    .img-upload-box:hover .overlay-upload { opacity: 1; }

    /* Custom Dropdown Styles */
    .custom-select-wrapper { position: relative; }
    .custom-select-trigger {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.58rem 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
      font-size: 0.925rem;
      min-height: 44.5px;
    }
    .input-group-text {
      border-top-left-radius: 12px !important;
      border-bottom-left-radius: 12px !important;
      background-color: #fff;
      border-right: none;
    }
    .form-control {
      border-top-right-radius: 12px !important;
      border-bottom-right-radius: 12px !important;
      border-left: none;
      font-size: 0.925rem;
      min-height: 44.5px;
    }
    .form-control:focus {
      box-shadow: none;
      border-color: #3b82f6;
    }
    .input-group:focus-within {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
    .input-group:focus-within .input-group-text,
    .input-group:focus-within .form-control {
      border-color: #3b82f6;
    }
    .custom-select-trigger:hover { border-color: #3b82f6; background: #fff; }
    .custom-select-menu {
      position: absolute;
      top: 105%; left: 0; right: 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      z-index: 1050;
      max-height: 250px;
      overflow-y: auto;
      padding: 8px;
    }
    .custom-select-option {
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }
    .custom-select-option:hover { background: #f1f5f9; color: #3b82f6; }
    .custom-select-option.selected { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
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

  showStatusMenu = false;
  showCategoryMenu = false;
  showSupplierMenu = false;

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
      price: ['0', Validators.required],
      price_unit: ['0'],
      price_package: ['0'],
      cost: ['0', Validators.required],
      stock: ['0', Validators.required],
      image: [''],
      mim_stock: ['5'],
      max_stock: ['100'],
      useCustomStockLimit: [false],
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
    this.productForm.get('useCustomStockLimit')?.valueChanges.subscribe(val => {
      if (!val) {
        this.productForm.patchValue({ mim_stock: '5', max_stock: '100' });
      }
    });
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
            descripcion: p.descripcion || p.description || '',
            status: p.status || 'active',
            category_id: p.category_id || p.categoryId || p.category?.id || null,
            supplier_id: p.supplier_id || p.supplierId || p.supplier?.id || null,
            price: this.formatCurrency(p.price || p.Price),
            price_unit: this.formatCurrency(p.price_unit || p.priceUnit || 0),
            price_package: this.formatCurrency(p.price_package || p.pricePackage || 0),
            cost: this.formatCurrency(p.cost),
            stock: p.stock || '0',
            image: p.image,
            mim_stock: p.mim_stock ?? p.mimStock ?? p.minStock ?? '5',
            max_stock: p.max_stock ?? p.maxStock ?? '100',
            useCustomStockLimit: true, // If editing, we show them by default to avoid confusion
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

  getCategoryName() {
    const cat = this.categories.find(c => c.id === this.productForm.get('category_id')?.value);
    return cat ? cat.name : 'Categoría No Asignada';
  }

  getSupplierName() {
    const sup = this.suppliers.find(s => s.id === this.productForm.get('supplier_id')?.value);
    return sup ? sup.name : 'Laboratorio Desconocido';
  }

  getStockClass() {
    const stock = this.productForm.get('stock')?.value;
    if (stock === 0) return 'text-danger';
    if (stock <= 40) return 'text-warning';
    return 'text-success';
  }

  calculateMargin() {
    const price = this.productForm.get('price')?.value || 0;
    const cost = this.productForm.get('cost')?.value || 0;
    if (price === 0) return 0;
    return Math.round(((price - cost) / price) * 100);
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for Base64 (database safety)
         alert('La imagen es muy pesada. Máximo 2MB.');
         return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.productForm.patchValue({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  selectCategory(cat: any) {
    this.productForm.patchValue({ category_id: cat.id });
    this.showCategoryMenu = false;
  }

  selectSupplier(sup: any) {
    this.productForm.patchValue({ supplier_id: sup.id });
    this.showSupplierMenu = false;
  }

  selectStatus(val: string) {
    this.productForm.patchValue({ status: val });
    this.showStatusMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-wrapper')) {
      this.showStatusMenu = false;
      this.showCategoryMenu = false;
      this.showSupplierMenu = false;
    }
  }

  // --- FUNCIONALIDADES DE PRECIO (FORMATO COLOMBIA) ---
  formatCurrency(val: any): string {
    if (val === null || val === undefined || val === '') return '0';
    let cleanStr = String(val).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  }

  onFocusNumber(field: string) {
    const val = this.productForm.get(field)?.value;
    if (val === 0 || val === '0' || val === '0.00' || val === '0,00' || val === '') {
      this.productForm.get(field)?.setValue('');
    }
    // NOTA: No quitamos el formato aquí para que funcione a la par con (input).
  }

  onInputCurrency(event: any, field: string) {
    let val = event.target.value;
    let cleanStr = val.replace(/[^\d,]/g, '');
    let parts = cleanStr.split(',');
    let intPart = parts[0];
    if (intPart) {
      if (intPart !== '0' && intPart.length > 1) intPart = intPart.replace(/^0+/, '');
      if (intPart === '') intPart = '0';
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    let finalStr = parts.length > 1 ? intPart + ',' + parts[1].substring(0, 2) : intPart;
    if (val !== finalStr) {
       this.productForm.get(field)?.setValue(finalStr, {emitEvent: false});
    }
  }

  onInputNumber(event: any, field: string) {
    let val = event.target.value;
    let cleanStr = val.replace(/[^\d]/g, '');
    if (cleanStr !== '' && cleanStr !== '0' && cleanStr.length > 1) cleanStr = cleanStr.replace(/^0+/, '');
    if (cleanStr === '') cleanStr = '0';
    if (val !== cleanStr) {
       this.productForm.get(field)?.setValue(cleanStr, {emitEvent: false});
    }
  }

  onBlurCurrency(field: string) {
    let val = this.productForm.get(field)?.value;
    if (val === null || val === '') {
      this.productForm.get(field)?.setValue('0');
      return;
    }
    this.productForm.get(field)?.setValue(this.formatCurrency(val));
  }

  onBlurNumber(field: string) {
    let val = this.productForm.get(field)?.value;
    if (val === null || val === '') {
      this.productForm.get(field)?.setValue('0');
    }
  }

  // --- ETIQUETAS DE LA VISTA DEL PRODUCTO ---
  isExpired(): boolean {
    const exp = this.productForm.get('expires_at')?.value || this.productForm.get('expiration_date')?.value;
    if (!exp) return false;
    return new Date(exp).getTime() < new Date().getTime();
  }

  isExpiringSoon(): boolean {
    const exp = this.productForm.get('expires_at')?.value || this.productForm.get('expiration_date')?.value;
    if (!exp) return false;
    const days = (new Date(exp).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return days > 0 && days <= 90;
  }

  isStockCritical(): boolean {
    const stock = Number(this.productForm.get('stock')?.value) || 0;
    const min = Number(this.productForm.get('mim_stock')?.value) || 5;
    return stock <= min;
  }

  isOverstock(): boolean {
    const stock = Number(this.productForm.get('stock')?.value) || 0;
    const max = Number(this.productForm.get('max_stock')?.value) || 100;
    return stock > max && max > 0;
  }

  getHeaderStatusClass() {
    if (this.data.mode !== 'view') return 'bg-white';
    if (this.isExpired()) return 'status-header-expired';
    if (this.isStockCritical()) return 'status-header-critical';
    if (this.isExpiringSoon()) return 'status-header-expiring';
    if (this.isOverstock()) return 'status-header-overstock';
    return 'bg-white';
  }

  save() {
    if (this.productForm.valid) {
      const formValue = { ...this.productForm.getRawValue() };
      
      const cleanNum = (val: any) => {
        if (typeof val === 'string') {
           return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
        }
        return Number(val) || 0;
      };

      formValue.price = cleanNum(formValue.price);
      formValue.cost = cleanNum(formValue.cost);
      formValue.price_unit = cleanNum(formValue.price_unit);
      formValue.price_package = cleanNum(formValue.price_package);
      formValue.stock = cleanNum(formValue.stock);
      formValue.mim_stock = cleanNum(formValue.mim_stock);
      formValue.max_stock = cleanNum(formValue.max_stock);
      formValue.units_per_package = cleanNum(formValue.units_per_package);
      
      if (!formValue.useCustomStockLimit) {
        formValue.mim_stock = 5;
        formValue.max_stock = 100;
      }
      
      formValue.expires_at = formValue.expiration_date;
      
      this.dialogRef.close(formValue);
    }
  }

  close() { this.dialogRef.close(); }
}
