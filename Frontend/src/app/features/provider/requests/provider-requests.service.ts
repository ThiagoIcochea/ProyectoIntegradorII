


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { APP_API_BASE_URL } from '../../../core/constants/app.constants'; 



@Injectable({
  providedIn: 'root'
})
export class ProviderRequestsService {




constructor(private http: HttpClient) {}











  listarSolicitudes(): Observable<any[]> {

    return this.http.get<any[]>(
      `${APP_API_BASE_URL}/solicitudes/proveedor/mis-solicitudes`
    );
  }


  aprobarPedido(idSolicitud:number){

  return this.http.put(
    `${APP_API_BASE_URL}/solicitudes/${idSolicitud}/aprobar`,
    {}
  );

}
  rechazarPedido(idSolicitud:number, promp: string){

  return this.http.put(
    `${APP_API_BASE_URL}/solicitudes/${idSolicitud}/${encodeURIComponent(promp)}/rechazar`,
    {}
  );

}

}









