




import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DeliveryRequest } from './delivery.model'; 
import { TrackingStep } from './tracking-step.model';
import { DeliveryDetail } from './delivery-detail.model';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';


@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {

  constructor(
    private http: HttpClient
  ) {}

 

  listarSolicitudesEntrega(): Observable<DeliveryRequest[]> {

    return this.http.get<DeliveryRequest[]>(
      `${APP_API_BASE_URL}/solicitudes/proveedor/entregas`
    );
  }


listarTrackingSolicitud(
      idSolicitud: number
  ): Observable<TrackingStep[]> {

    return this.http.get<
      TrackingStep[]
    >(

      `${APP_API_BASE_URL}/solicitudes/proveedor/${idSolicitud}/tracking`

    );

  }



listarDetallesEntrega(idSolicitud:number):
      Observable<DeliveryDetail[]> {

    return this.http.get<
      DeliveryDetail[]
    >(

      `${APP_API_BASE_URL}/solicitudes/proveedor/entregas/detalles/${idSolicitud}`

    );

  }




 actualizarEstado(
  id: number,
  estado: string,
  codigo?: string
): Observable<void> {

  let params = new HttpParams()
    .set('estado', estado);

  if (codigo) {
    params = params.set('codigo', codigo);
  }

  return this.http.put<void>(
    `${APP_API_BASE_URL}/solicitudes/proveedor/${id}/estado`,
    {},
    { params }
  );
}











}






















