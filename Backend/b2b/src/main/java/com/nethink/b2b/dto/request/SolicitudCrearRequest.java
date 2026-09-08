package com.nethink.b2b.dto.request;

import java.util.List;

public record SolicitudCrearRequest(

        Integer idProveedor,

        Integer idEmpresa,

        List<ItemCotizadoRequest> items,

        String direccionEnvio

) {}