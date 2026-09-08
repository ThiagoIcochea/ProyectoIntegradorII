// Backend touchpoint: provider matching results and selection state for quotation.
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { APP_STORAGE_KEYS, APP_ROUTE_PATHS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-results.html',
  styleUrl: './rfq-results.scss'
})
export class RfqResultsComponent implements OnInit {
  providers: any[] = [];

  summaryItems: any[] = [];

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['proveedores']) {
      this.providers = navigation.extras.state['proveedores'];
    }
  }

  ngOnInit(): void {
    const savedCart = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    if (savedCart) {
      this.summaryItems = JSON.parse(savedCart);
    }

    if (this.providers.length === 0) {
      this.router.navigate([APP_ROUTE_PATHS.rfqCatalog]);
    }
  }

  seleccionarProveedor(provider: any): void {
   
    localStorage.setItem(APP_STORAGE_KEYS.selectedProvider, JSON.stringify(provider));
    this.router.navigate([APP_ROUTE_PATHS.rfqQuotation]);
  }
}
