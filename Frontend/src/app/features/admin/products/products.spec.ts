import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminProductsComponent } from './products';

describe('AdminProductsComponent responsive detail', () => {
  let component: AdminProductsComponent;
  let fixture: ComponentFixture<AdminProductsComponent>;

  beforeEach(async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => vi.restoreAllMocks());

  it('abre el producto seleccionado y permite regresar al catalogo', () => {
    const product = {
      idProducto: 8,
      name: 'Switch administrable',
      status: 'Activo',
      images: []
    };

    component.seleccionarProducto(product);

    expect(component.detailViewOpen).toBe(true);
    expect(component.selectedProduct).toBe(product);

    component.showProductList();

    expect(component.detailViewOpen).toBe(false);
  });
});
