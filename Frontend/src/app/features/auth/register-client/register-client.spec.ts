import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RegisterClientComponent as RegisterClient } from './register-client';

describe('RegisterClient', () => {
  let component: RegisterClient;
  let fixture: ComponentFixture<RegisterClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterClient],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
