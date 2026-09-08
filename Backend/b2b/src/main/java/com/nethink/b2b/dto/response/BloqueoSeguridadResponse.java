package com.nethink.b2b.dto.response;

import java.time.LocalDateTime;

public record BloqueoSeguridadResponse(
        Long idBloqueo, String tipo, String identificador, int intentosFallidos,
        String motivo, LocalDateTime fechaBloqueo, String nombreUsuario, String correoUsuario) { }
