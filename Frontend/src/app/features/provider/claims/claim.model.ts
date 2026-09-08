export type ClaimStatus = 'ABIERTO' | 'EN_REVISION' | 'RESUELTO' | 'RECHAZADO';

export interface ClaimHistoryItem {
  estado: ClaimStatus | string;
  descripcion: string;
  fecha: string;
}

export interface ProviderClaim {
  idReclamo: number;
  idSolicitud: number;
  idUsuario: number;
  idProveedor: number;
  tipo: string;
  descripcion: string;
  evidenciaUrl?: string;
  estado: ClaimStatus | string;
  resolucion?: string;
  fechaCreacion: string;
  fechaResolucion?: string;
  nombreCliente?: string;
  correoCliente?: string;
  telefonoCliente?: string;
  nombreEmpresa?: string;
  direccionEnvio?: string;
  totalSolicitud?: number;
  estadoSolicitud?: string;
  historial: ClaimHistoryItem[];
}

export interface UpdateClaimStatusRequest {
  estado: ClaimStatus;
  resolucion?: string;
  accion?: string;
  codigoEntrega?: string;
}
