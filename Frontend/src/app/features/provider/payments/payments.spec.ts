import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { ProviderPaymentsComponent as Payments } from './payments';

describe('Payments', () => {
  let component: Payments;
  let fixture: ComponentFixture<Payments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Payments],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Payments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
