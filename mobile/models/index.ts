export type Role = 'CLIENTE' | 'PROVEEDOR' | 'ADMIN';
export interface Session { token: string; role: Role; email: string; idUsuario?: string; }
export interface LoginResponse { token?: string; rol?: string; role?: string; correo?: string; idUsuario?: number; requiresMfa?: boolean; tempToken?: string; purpose?: string; email?: string; expiresInSeconds?: number; }
export type MfaMethod = 'email' | 'sms' | 'whatsapp' | 'call';
export interface MfaFlow { email: string; tempToken: string; purpose: string; expiresInSeconds?: number; emailOnly?: boolean; method?: MfaMethod; }
export interface Product { idProducto?: number; id?: number; producto?: string; nombre?: string; marca?: string; categoria?: string; descripcion?: string; precioUnitario?: number; precio?: number; stock?: number; imagenes?: { url: string; principal?: boolean }[]; }
export interface Request { idSolicitud?: number; id?: number; estado?: string; proveedor?: string; razonSocial?: string; fechaCreacion?: string; total?: number; productos?: unknown[]; [key: string]: unknown; }
export interface UserProfile { nombres?: string; apellidos?: string; correo?: string; telefono?: string; whatsapp?: string; direccion?: string; razonSocial?: string; ruc?: string; descripcion?: string; rol?: Role; fotoPerfil?: string; notificacionesRfq?: boolean; entregaRapida?: boolean; }
