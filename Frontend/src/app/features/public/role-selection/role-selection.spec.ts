import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RoleSelectionComponent as RoleSelection } from './role-selection';

describe('RoleSelection', () => {
  let component: RoleSelection;
  let fixture: ComponentFixture<RoleSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelection],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
