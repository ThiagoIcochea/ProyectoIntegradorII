import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from './Notification.service';

@Component({
  selector: 'app-request-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './request-evaluation.html',
  styleUrl: './request-evaluation.scss'
})
export class RequestEvaluationComponent implements OnInit {

  solicitudId!: number;

  servicio = 0;

  calidad = 0;

  tiempo = 0;

  comunicacion = 0;

  comment = '';

  submitting = false;

  errorMessage = '';

  providerName = '';

  fechaEntrega = '';

  total = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notification: NotificationService
  ){}

  ngOnInit(): void {

    this.solicitudId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    /*
      Aquí puedes consultar la información de la solicitud.

      this.notification.obtenerSolicitudEvaluacion(this.solicitudId)
      .subscribe(...)
    */

  }

  setRating(tipo:string,valor:number){

    switch(tipo){

      case 'servicio':
        this.servicio=valor;
        break;

      case 'calidad':
        this.calidad=valor;
        break;

      case 'tiempo':
        this.tiempo=valor;
        break;

      case 'comunicacion':
        this.comunicacion=valor;
        break;

    }

  }

  submitEvaluation(){

    if (this.submitting) {

      return;

    }

    if(
      this.servicio==0 ||
      this.calidad==0 ||
      this.tiempo==0 ||
      this.comunicacion==0
    ){

      alert("Debe completar todas las calificaciones.");

      return;

    }

    const body={

      idSolicitud:this.solicitudId,

      estrellasServicio:this.servicio,

      estrellasCalidad:this.calidad,

      estrellasTiempo:this.tiempo,

      estrellasComunicacion:this.comunicacion,

      comentario:this.comment

    };

    console.log(body);

    this.submitting = true;
    this.errorMessage = '';

    this.notification
        .registrarEvaluacion(body)
        .subscribe({

            next:()=>{

                this.submitting = false;

                alert("Evaluación registrada correctamente.");

                this.router.navigate(['/app/history']);

            },

            error:(err)=>{

                this.submitting = false;
                this.errorMessage =
                  err?.error?.message || "Ocurrio un error.";

                alert(this.errorMessage);


            }

        });

    

    

  }

}
