import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { AdminIntegrationsComponent as Integrations } from './integrations';

describe('Integrations', () => {
  let component: Integrations;
  let fixture: ComponentFixture<Integrations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Integrations],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Integrations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
