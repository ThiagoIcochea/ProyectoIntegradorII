package com.nethink.b2b.service;

import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Usuario;

public interface EmailService {

    void enviarCorreoCliente(Solicitud solicitud);

    void enviarCorreoProveedor(Solicitud solicitud);
    void enviarCorreoEvaluacionCliente(Solicitud solicitud);
    void enviarCorreoReclamoDemora(Solicitud solicitud, String descripcion, String evidenciaJson);
    void enviarCorreoRegistroCliente(Usuario usuario);
    void enviarCorreoActualizacionUsuario(Usuario usuario, String titulo, String mensaje, String asunto);
    void enviarCorreoActualizacionCliente(Solicitud solicitud, String titulo, String mensaje, String asunto);
    void enviarCorreoEstadoSolicitud(Solicitud solicitud, String estado, String descripcion);
    void enviarCorreoEstadoReclamo(Solicitud solicitud, String estado, String descripcion);
    void enviarCodigoMfa(String correo, String codigo, String metodo, String proposito, int minutosExpiracion);
    void enviarAlertaProveedorSuspendido(String correoAdmin, String proveedor, String correoProveedor, int reclamos);
    void enviarAlertaStockBajo(ProveedorProducto proveedorProducto);

void enviarAlertaSinStock(ProveedorProducto proveedorProducto);

void enviarAlertaReposicionStock(ProveedorProducto proveedorProducto, Integer stockAnterior);
    void enviarCorreoRegistroProveedor(
            Usuario usuario,
            String razonSocial,
            String ruc
    );
}
