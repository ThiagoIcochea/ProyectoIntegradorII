package com.nethink.b2b.service;

import com.nethink.b2b.entity.LogsSistema;
import com.nethink.b2b.repository.LogsSistemaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class LogsSistemaService {

    private final LogsSistemaRepository logsRepository;

    public LogsSistemaService(
            LogsSistemaRepository logsRepository
    ) {
        this.logsRepository = logsRepository;
    }

    @Async
    public void registrarLog(
            Integer idUsuario,
            String accion,
            String modulo,
            String descripcion,
            HttpServletRequest request
    ) {

        try {

            LogsSistema log =
                    new LogsSistema();

            log.setIdUsuario(idUsuario);

            log.setAccion(accion);

            log.setModulo(modulo);

            log.setDescripcion(descripcion);

            if (request != null) {

                log.setIp(
                        request.getRemoteAddr()
                );
            }

            logsRepository.save(log);

        } catch (Exception e) {

            System.out.println(
                "Error guardando log: "
                + e.getMessage()
            );
        }
    }
}