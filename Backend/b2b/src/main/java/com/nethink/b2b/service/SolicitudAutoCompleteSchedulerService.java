package com.nethink.b2b.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SolicitudAutoCompleteSchedulerService {

    private final SolicitudService solicitudService;
    private final LogsSistemaService logsSistemaService;

    public SolicitudAutoCompleteSchedulerService(
            SolicitudService solicitudService,
            LogsSistemaService logsSistemaService
    ) {
        this.solicitudService = solicitudService;
        this.logsSistemaService = logsSistemaService;
    }

    @Scheduled(fixedRate = 300000)
    public void completarSolicitudesEntregadas() {
        int completadas = solicitudService.autoCompletarEntregadasVencidas();

        if (completadas > 0) {
            logsSistemaService.registrarLog(
                    null,
                    "AUTO_COMPLETAR_ENTREGADAS",
                    "SOLICITUDES",
                    "Solicitudes completadas automaticamente: " + completadas,
                    null
            );
        }
    }
}
