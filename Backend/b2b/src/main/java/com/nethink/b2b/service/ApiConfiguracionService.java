package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.ApiConfiguracionRequest;
import com.nethink.b2b.dto.response.ApiConfiguracionResponse;
import com.nethink.b2b.entity.LogsApi;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.LogsApiRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ApiConfiguracionService {

    private final ProveedorRepository proveedorRepo;
    private final LogsApiRepository logsApiRepo;
    private final RestTemplate restTemplate;
    
        @Autowired
    private ProveedorRepository proveedorRepository;

    public ApiConfiguracionService(
            ProveedorRepository proveedorRepo,
            LogsApiRepository logsApiRepo,
            RestTemplate restTemplate
    ) {
        this.proveedorRepo = proveedorRepo;
        this.logsApiRepo = logsApiRepo;
        this.restTemplate = restTemplate;
    }

    public ApiConfiguracionResponse obtenerConfiguracion(String correo) {

        Proveedor proveedor =
                proveedorRepo.findByUsuario_Correo(correo)
                        .orElseThrow();

        ApiConfiguracionResponse dto =
                new ApiConfiguracionResponse();

        dto.setApiUrl(proveedor.getApiUrl());
        dto.setApiTipo(proveedor.getApiTipo());
        dto.setApiToken(proveedor.getApiToken());
        dto.setEstadoProveedor(proveedor.getEstado());

        Optional<LogsApi> ultimoLog =
                logsApiRepo.findTopByProveedor_IdProveedorOrderByFechaDesc(
                        proveedor.getIdProveedor()
                );

        if (ultimoLog.isPresent()) {

            LogsApi log = ultimoLog.get();

            dto.setEndpoint(log.getEndpoint());
            dto.setMetodoHttp(log.getMetodoHttp());
            dto.setCodigoRespuesta(log.getCodigoRespuesta());
            dto.setTiempoRespuestaMs(log.getTiempoRespuestaMs());
            dto.setEstadoConexion(log.getEstado().name());
            dto.setDescripcion(log.getDescripcion());

            dto.setFechaUltimaConexion(
                    log.getFecha()
                            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            );
        }

        return dto;
    }

    public void actualizarConfiguracion(
            String correo,
            ApiConfiguracionRequest request
    ) {

        Proveedor proveedor =
                proveedorRepo.findByUsuario_Correo(correo)
                        .orElseThrow();

        proveedor.setApiUrl(request.getApiUrl());
        proveedor.setApiTipo(request.getApiTipo());
        proveedor.setApiToken(normalizarTokenOpcional(request.getApiToken()));

        proveedorRepo.save(proveedor);
    }

   public ApiConfiguracionResponse probarConexion(String correo) {

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(correo)
                    .orElseThrow();

    LogsApi log = new LogsApi();

    log.setProveedor(proveedor);
    log.setEndpoint(proveedor.getApiUrl());

    long inicio = System.currentTimeMillis();

    try {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (proveedor.getApiToken() != null
                && !proveedor.getApiToken().isBlank()) {

            headers.setBearerAuth(proveedor.getApiToken());
        }

        ResponseEntity<String> response;

        if ("GRAPHQL".equalsIgnoreCase(proveedor.getApiTipo())) {

            String query = """
            {
              "query": "query { __typename }"
            }
            """;

            HttpEntity<String> entity =
                    new HttpEntity<>(query, headers);

            response = restTemplate.exchange(
                    proveedor.getApiUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.setMetodoHttp("POST");

        } else {

            HttpEntity<String> entity =
                    new HttpEntity<>(headers);

            response = restTemplate.exchange(
                    proveedor.getApiUrl(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.setMetodoHttp("GET");
        }

        long fin = System.currentTimeMillis();

        log.setCodigoRespuesta(
                String.valueOf(response.getStatusCode().value())
        );

        log.setTiempoRespuestaMs((int) (fin - inicio));

        log.setEstado(LogsApi.Estado.OK);
        
        proveedor.setEstadoApi("OK");
        
        log.setDescripcion("Conexión exitosa");

    } catch (Exception e) {

        long fin = System.currentTimeMillis();

        log.setCodigoRespuesta("500");

        log.setTiempoRespuestaMs((int) (fin - inicio));

        log.setEstado(LogsApi.Estado.ERROR);
        proveedor.setEstadoApi("ERROR");

        log.setDescripcion(e.getMessage());
    }

    logsApiRepo.save(log);
    proveedor = proveedorRepository.save(proveedor);

    return obtenerConfiguracion(correo);
}

private String normalizarTokenOpcional(String token) {
    if (token == null || token.isBlank()) {
        return null;
    }

    return token.trim();
}
}
