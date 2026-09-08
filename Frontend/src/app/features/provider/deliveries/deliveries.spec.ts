import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { ProviderDeliveriesComponent as Deliveries } from './deliveries';

describe('Deliveries', () => {
  let component: Deliveries;
  let fixture: ComponentFixture<Deliveries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deliveries],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Deliveries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders deliveries when the request completes without another click', async () => {
    const http = TestBed.inject(HttpTestingController);
    const requests = http.match(() => true);
    expect(requests.length).toBeGreaterThan(0);
    requests[0].flush([{ idSolicitud: 1, estado: 'PAGADA', nombreEmpresa: 'Entrega de prueba' }]);
    await fixture.whenStable();
    http.match(() => true).forEach(request => request.flush([]));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.order-item')?.textContent).toContain('Entrega de prueba');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
