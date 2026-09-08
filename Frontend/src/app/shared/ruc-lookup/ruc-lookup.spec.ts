import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { componentTestProviders } from '../../testing/component-test.providers';
import { RucLookupComponent } from './ruc-lookup';

describe('RUC lookup', () => {
  afterEach(() => vi.useRealTimers());
  it('cancels the old lookup and only displays the current company', async () => {
    TestBed.configureTestingModule({ imports: [RucLookupComponent], providers: componentTestProviders });
    const fixture = TestBed.createComponent(RucLookupComponent);
    await fixture.whenStable();
    vi.useFakeTimers();
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.cambiarRuc('20123456789');
    await vi.advanceTimersByTimeAsync(350);
    const old = http.expectOne(req => req.url.endsWith('/20123456789'));
    component.cambiarRuc('20987654321');
    expect(old.cancelled).toBe(true);
    expect(component.empresa()).toBe(null);
    await vi.advanceTimersByTimeAsync(350);
    http.expectOne(req => req.url.endsWith('/20987654321')).flush({
      ruc: '20987654321', razonSocial: 'Empresa Actual', descripcion: 'Estado SUNAT: ACTIVO.'
    });
    expect(component.empresa()?.razonSocial).toBe('Empresa Actual');
    expect(component.loading()).toBe(false);
    fixture.destroy();
    http.verify();
  });
  it('does not query incomplete RUC and allows retry after a failure', async () => {
    TestBed.configureTestingModule({ imports: [RucLookupComponent], providers: componentTestProviders });
    const fixture = TestBed.createComponent(RucLookupComponent);
    await fixture.whenStable();
    vi.useFakeTimers();
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.cambiarRuc('2012');
    await vi.advanceTimersByTimeAsync(350);
    http.expectNone(() => true);
    component.cambiarRuc('20123456789');
    await vi.advanceTimersByTimeAsync(350);
    http.expectOne(() => true).flush({}, {status: 503, statusText: 'Unavailable'});
    expect(component.error()).toContain('No se pudo');
    expect(component.empresa()).toBe(null);
    component.consultar();
    await vi.advanceTimersByTimeAsync(350);
    http.expectOne(() => true).flush({ruc: '20123456789', razonSocial: 'Empresa', descripcion: 'ACTIVO'});
    expect(component.error()).toBe('');
    fixture.destroy();
    http.verify();
  });
});
