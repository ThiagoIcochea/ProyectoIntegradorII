import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { AdminProvidersComponent as Providers } from './providers';

describe('Providers', () => {
  let component: Providers;
  let fixture: ComponentFixture<Providers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Providers],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Providers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
