import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

@Component({ standalone: true, template: '' })
class TestRouteComponent {}

/** Common infrastructure for shallow standalone-component tests. */
export const componentTestProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([{ path: '**', component: TestRouteComponent }])
];
