import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { AdminRfqsComponent as Rfqs } from './rfqs';

describe('Rfqs', () => {
  let component: Rfqs;
  let fixture: ComponentFixture<Rfqs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rfqs],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Rfqs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
