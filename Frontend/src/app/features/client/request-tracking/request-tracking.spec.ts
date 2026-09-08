import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RequestTrackingComponent as RequestTracking } from './request-tracking';

describe('RequestTracking', () => {
  let component: RequestTracking;
  let fixture: ComponentFixture<RequestTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTracking],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RequestTracking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
