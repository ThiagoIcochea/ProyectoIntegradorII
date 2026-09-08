// Backend touchpoint: role selection drives which registration flow the user enters.
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.scss'
})
export class RoleSelectionComponent {
  roles = [
    {
      title: 'Cliente',
      description: 'Gestiona RFQs, compara proveedores y realiza compras de infraestructura de red.',
      icon: '🧑‍💼',
      route: '/register-client'
    },
    {
      title: 'Proveedor',
      description: 'Recibe solicitudes, cotiza productos de red y gestiona entregas.',
      icon: '🏭',
      route: '/register-provider'
    }
  ];

  selectedRole = this.roles[0];

  constructor(private router: Router) {}

  seleccionarRol(role: (typeof this.roles)[number]): void {
    this.selectedRole = role;
    this.router.navigate([role.route]);
  }
}
