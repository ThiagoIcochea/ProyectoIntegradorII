import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RfqCatalogComponent as RfqCatalog } from './rfq-catalog';

describe('RfqCatalog', () => {
  let component: RfqCatalog;
  let fixture: ComponentFixture<RfqCatalog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfqCatalog],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RfqCatalog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
