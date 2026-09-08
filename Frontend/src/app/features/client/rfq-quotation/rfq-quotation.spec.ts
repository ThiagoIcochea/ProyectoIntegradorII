import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RfqQuotationComponent as RfqQuotation } from './rfq-quotation';

describe('RfqQuotation', () => {
  let component: RfqQuotation;
  let fixture: ComponentFixture<RfqQuotation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfqQuotation],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RfqQuotation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
