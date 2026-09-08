import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProviderRequestsComponent } from './requests';

describe('ProviderRequestsComponent responsive detail', () => {
  let component: ProviderRequestsComponent;
  let fixture: ComponentFixture<ProviderRequestsComponent>;

  beforeEach(async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [ProviderRequestsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderRequestsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => vi.restoreAllMocks());

  it('abre el detalle seleccionado y permite regresar a la lista', () => {
    const request = { idSolicitud: 21, detalles: [{ nombreProducto: 'Router' }] };

    component.selectRequest(request);

    expect(component.detailViewOpen).toBe(true);
    expect(component.selectedRequest).toBe(request);
    expect(component.productos).toHaveLength(1);

    component.showRequestList();

    expect(component.detailViewOpen).toBe(false);
  });
});
