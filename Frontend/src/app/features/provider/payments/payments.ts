

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PagoService } from './provider-payment.service';
import { Payment } from './payments.model';
import { FormsModule } from '@angular/forms';





@Component({
  selector: 'app-provider-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})


export class ProviderPaymentsComponent  implements OnInit    {

 
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  searchTerm = '';
  loading = true;
  errorMessage = '';
  voucherZoom = 1;
  readonly minVoucherZoom = 0.5;
  readonly maxVoucherZoom = 2.5;
  readonly skeletonRows = Array.from({ length: 4 });

  selectedPayment: Payment | null = null;

  accionModal: 'APROBAR' | 'RECHAZAR' | null = null;
  mostrarModal = false;

  constructor(
    private pagoService: PagoService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
  this.cargarPagos();
}


private cargarPagos(): void {
  this.loading = true;
  this.errorMessage = '';

  this.pagoService.listarMisPagos()
    .subscribe({
      next: (payments) => {
      const prioridad: Record<string, number> = {
  VALIDANDO: 1,
  APROBADO: 2,
  RECHAZADO: 3
};

this.payments = (payments || [])
  .sort((a: any, b: any) => {

    const estadoA = (a.estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    const estadoB = (b.estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    const prioridadA = prioridad[estadoA] ?? 999;
    const prioridadB = prioridad[estadoB] ?? 999;

   
    if (prioridadA !== prioridadB) {
      return prioridadA - prioridadB;
    }

    
    const fechaA = new Date(
      a.fechaPago ||
      a.fechaCreacion ||
      a.fechaRegistro ||
      a.fecha
    ).getTime();

    const fechaB = new Date(
      b.fechaPago ||
      b.fechaCreacion ||
      b.fechaRegistro ||
      b.fecha
    ).getTime();

    return fechaA -  fechaB ;
  });
      this.filtrarPagos();

      if (this.filteredPayments.length > 0) {
        const currentId = this.selectedPayment?.idPago;
        this.selectedPayment =
          this.filteredPayments.find(payment => payment.idPago === currentId) ||
          this.filteredPayments[0];
      } else {
        this.selectedPayment = null;
      }

      this.voucherZoom = 1;
      this.loading = false;
          this.cdr.markForCheck();
      this.notifyProviderCountsRefresh();
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error(err);
      this.payments = [];
      this.filteredPayments = [];
      this.selectedPayment = null;
      this.errorMessage = 'No se pudieron cargar los pagos.';
      this.loading = false;
          this.cdr.markForCheck();
      this.notifyProviderCountsRefresh();
      this.cdr.markForCheck();
    }
  });
}

filtrarPagos(): void {
  const text = this.searchTerm.trim().toLowerCase();

  if (!text) {
    this.filteredPayments = [...this.payments];
    return;
  }

  this.filteredPayments = this.payments.filter(payment => [
    this.getPagoCode(payment),
    this.getCotCode(payment),
    payment.nombreEmpresa,
    payment.rucEmpresa,
    payment.correoCliente,
    payment.estado,
    payment.codigoOperacion
  ].some(value => (value || '').toString().toLowerCase().includes(text)));
}

seleccionarPago(pago: Payment): void {
    this.selectedPayment = pago;
    this.voucherZoom = 1;
  }



abrirModal(accion: 'APROBAR' | 'RECHAZAR'): void {
  if (!this.selectedPayment) return;

  this.accionModal = accion;
  this.mostrarModal = true;
}




cerrarModal(): void {

  this.mostrarModal = false;
  this.accionModal=null; 


}




confirmarAccion(): void {
  if (!this.selectedPayment) return;

  const idPago = this.selectedPayment.idPago;

  if (this.accionModal === 'APROBAR') {
    this.aprobarPago(idPago);
  }

  if (this.accionModal === 'RECHAZAR') {
    this.rechazarPago(idPago);
  }
}




aprobarPago(idPago:number): void {

    //if (!this.selectedPayment) return;

    //const idPago = this.selectedPayment?.idPago;

  //if (!idPago) {
   // console.error("idPago no válido");
   //return;
  //}

    this.pagoService
      .aprobarPago(idPago)
      .subscribe({

        next: (resp) => {
          //alert('Pago aprobado correctamente');

            this.recargarPagos(); 
            this.cerrarModal(); 
          // recargar lista
          //this.payments$ =
          //  this.pagoService.listarMisPagos()

           // .pipe(

            //  tap((pagos) => {

            //    this.selectedPayment =
             //     pagos.length > 0
             //       ? pagos[0]
             //       : null;

             // })

            //);  


        },

        error: (err) => {

          console.error(err);

          //this.mostrarModal=false; 

          //alert('Error al aprobar pago');

        }

      });

  }


rechazarPago(idPago:number): void {

    //if (!this.selectedPayment) return;

   // const idPago = this.selectedPayment?.idPago;

  //if (!idPago) {
  //  console.error("idPago no válido");
  //  return;
  //}

    this.pagoService
      .rechazarPago(idPago)
      .subscribe({

        next: (resp) => {
          //alert('Pago no aprobado');

            this.recargarPagos(); 
            this.cerrarModal(); 
          // recargar lista
          //this.payments$ =
          //  this.pagoService.listarMisPagos()

           // .pipe(

            //  tap((pagos) => {

            //    this.selectedPayment =
            //      pagos.length > 0
            //        ? pagos[0]
            //        : null;

            //  })

           // );  


        },

        error: (err) => {

          console.error(err);

          //this.mostrarModal=false; 

          //alert('Error al rechazar pago');

        }

      });

  }



private recargarPagos(): void {
  this.cargarPagos();
}

private notifyProviderCountsRefresh(): void {
  window.dispatchEvent(new Event('providerCountsRefresh'));
}



getFecha(date?: string) {
  if (!date){
   return ""; 
 }
  return new Date(date).toLocaleDateString('es-PE');
}



getHora(date: string) {
  if (!date){
   return ""; 

 }

  return new Date(date).toLocaleTimeString('es-PE');
}




getPagoCode(payment: any): string {
  if (!payment) return '';

  const year = new Date(payment.fechaPago).getFullYear();

  const id = String(payment.idPago).padStart(4, '0');

  return `PAG-${year}-${id}`;
}

getCotCode(payment: any): string {
  if (!payment) return '';

  const fecha = payment.fechaSolicitud || payment.fechaSolictud || payment.fechaPago;
  const year = new Date(fecha).getFullYear();

  const id = String(payment.idSolicitud).padStart(4, '0');

  return `COT-${year}-${id}`;
}

getVoucherUrl(payment: any = this.selectedPayment): string {
  if (!payment) {
    return '';
  }

  const candidates = [
    payment.comprobanteUrl,
    payment.comprobante_url,
    payment.voucherUrl,
    payment.voucher_url,
    payment.comprobante,
    payment.archivoAdjuntoUrl,
    payment.archivoUrl,
    payment.archivo,
    payment.urlAdjunto,
    payment.adjuntoUrl
  ];

  return candidates.find((value: any) => typeof value === 'string' && value.trim()) || '';
}

getVoucherType(url: string): 'image' | 'pdf' | 'other' {
  if (!url) {
    return 'other';
  }

  const normalized = url.toLowerCase();

  if (normalized.match(/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/)) {
    return 'image';
  }

  if (normalized.match(/\.pdf(\?.*)?$/)) {
    return 'pdf';
  }

  return 'other';
}

zoomInVoucher(): void {
  this.voucherZoom = Math.min(
    this.maxVoucherZoom,
    Number((this.voucherZoom + 0.25).toFixed(2))
  );
}

zoomOutVoucher(): void {
  this.voucherZoom = Math.max(
    this.minVoucherZoom,
    Number((this.voucherZoom - 0.25).toFixed(2))
  );
}

resetVoucherZoom(): void {
  this.voucherZoom = 1;
}

downloadVoucher(payment: Payment | null = this.selectedPayment): void {
  const voucherUrl = this.getVoucherUrl(payment);

  if (!voucherUrl) {
    alert('Comprobante no disponible');
    return;
  }

  const link = document.createElement('a');
  link.href = voucherUrl;
  link.download = `comprobante-${payment?.idPago || 'pago'}`;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


getFechaCompleta(date?: string): string    {

 if (!date){
   return ""; 
 }

  const fecha = new Date(date);


  const fechaTexto = fecha.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long'
  });

  const horaTexto = fecha.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${fechaTexto} a las ${horaTexto}`;
}



/* estado 

payments:Payment[]=[]; 

selectedPayment:Payment | null =null; 


constructor(private pagoService:PagoService, private zone:NgZone){
  console.log("constructor", Math.random())
   
}



ngOnInit():void{
  console.log("entrando al componente")
  this.cargarPagos(); 
}

*/



/*cargarPagos(): void { */

    



















   
/*
  console.log('🔥 LLAMANDO PAGOS');

  this.pagoService.listarMisPagos()
    .subscribe({
      next: (res) => {

        console.log('✅ RESPUESTA PAGOS:', res);

        this.zone.run(() => {
           console.log('RAW RESPONSE:', res);
  console.log('IS ARRAY:', Array.isArray(res));
          const data = res || [];

  this.payments = [...data].map(p => ({ ...p }));

          this.selectedPayment = this.payments.length
            ? this.payments[0]
            : null;
        });

        console.log('📦 PAYMENTS EN COMPONENTE:', this.payments);
      },

      error: (err) => {
        console.error('❌ ERROR PAGOS:', err);
      }
    });

    */
    







          /*this.payments = res ? [...res]:[];

          if (this.payments.length > 0) {
            this.selectedPayment = this.payments[0];
          }


            console.log('Pagos:', this.payments);
        },

        error: (err) => {
          console.error('Error al cargar pagos', err);
        }
      }); */
  }


  



























