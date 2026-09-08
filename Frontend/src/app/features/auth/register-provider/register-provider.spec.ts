import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RegisterProviderComponent as RegisterProvider } from './register-provider';

describe('RegisterProvider', () => {
  let component: RegisterProvider;
  let fixture: ComponentFixture<RegisterProvider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterProvider],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterProvider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows registration without an API token or manual company description', () => {
    component.nombres = 'Juan';
    component.apellidos = 'Perez';
    component.correo = 'juan@empresa.com';
    component.password = 'Clave123';
    component.telefono = '987654321';
    component.whatsapp = '987654321';
    component.direccion = 'Av. Principal 123';
    component.razonSocial = 'Empresa Demo SAC';
    component.ruc = '20123456789';
    component.apiUrl = 'https://api.empresa.com/catalogo';
    component.apiTipo = 'REST';
    component.apiToken = '';

    expect((component as any).hasRequiredFields()).toBe(true);
    expect((component as any).validateProviderForm()).toBe('');
  });
});
