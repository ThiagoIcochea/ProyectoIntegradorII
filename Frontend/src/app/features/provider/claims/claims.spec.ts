import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ProviderClaimsComponent } from './claims';
import { ProviderClaimsService } from './claims.service';

describe('Claims asynchronous rendering', () => {
  it('renders the response without another click', async () => {
    const response = new Subject<any[]>();
    TestBed.configureTestingModule({
      imports: [ProviderClaimsComponent],
      providers: [{ provide: ProviderClaimsService, useValue: { listarReclamos: () => response } }]
    });
    const fixture = TestBed.createComponent(ProviderClaimsComponent);
    await fixture.whenStable();
    response.next([{ idReclamo: 1, estado: 'ABIERTO', nombreEmpresa: 'Empresa de prueba', historial: [] }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.claim-item')?.textContent).toContain('Empresa de prueba');
    response.complete();
  });
});
