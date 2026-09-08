






import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Payment } from './payments.model';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';


@Injectable({
  providedIn: 'root'
})
export class PagoService {

  constructor(
    private http: HttpClient
  ) {}

  // =====================================
  // LISTAR PAGOS DEL PROVEEDOR
  // =====================================

  listarMisPagos(): Observable<Payment[]> {

    return this.http.get<Payment[]>(
      `${APP_API_BASE_URL}/pagos/proveedor/mis-pagos`
    );
  }


aprobarPago(idPago:number){

  
  
  return this.http.put<{ mensaje: string }>(
    `${APP_API_BASE_URL}/pagos/${idPago}/aprobar`,
    {}
  );

  /*return this.http.put(
    `${this.apiUrl}/api/pagos/${idPago}/aprobar`,
    {}
  );*/

}


rechazarPago(idPago:number){

  
  
  return this.http.put<{ mensaje: string }>(
    `${APP_API_BASE_URL}/pagos/${idPago}/rechazar`,
    {}
  );

  /*return this.http.put(
    `${this.apiUrl}/api/pagos/${idPago}/aprobar`,
    {}
  );*/

}












}





















