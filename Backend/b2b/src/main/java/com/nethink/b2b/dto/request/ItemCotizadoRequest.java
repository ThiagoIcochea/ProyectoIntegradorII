package com.nethink.b2b.dto.request;

import java.math.BigDecimal;


public record ItemCotizadoRequest(
    Integer idProducto,
    Integer cantidad,
    BigDecimal precioUnitario
) {}
