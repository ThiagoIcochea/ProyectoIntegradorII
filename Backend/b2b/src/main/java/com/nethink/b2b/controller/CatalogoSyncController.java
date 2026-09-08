package com.nethink.b2b.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.service.SyncCatalogoService;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoSyncController {

    private final SyncCatalogoService syncService;
    private final ProveedorRepository proveedorRepo;

    public CatalogoSyncController(
            SyncCatalogoService syncService,
            ProveedorRepository proveedorRepo
    ) {

        this.syncService = syncService;
        this.proveedorRepo = proveedorRepo;
    }

    @PostMapping("/sync/{idProveedor}")
    public String sincronizar(
            @PathVariable Integer idProveedor,
            @RequestBody Object requestBody
    ) {

        Proveedor proveedor =
                proveedorRepo.findById(idProveedor)
                        .orElseThrow();

        List<CatalogoResponse> data = parseCatalogoRequest(requestBody);

        for (CatalogoResponse dto : data) {

            syncService.sync(dto, proveedor);
        }

        return "Sincronización completada";
    }

    private List<CatalogoResponse> parseCatalogoRequest(Object requestBody) {
        if (requestBody == null) {
            return Collections.emptyList();
        }

        ObjectMapper mapper = new ObjectMapper();

        if (requestBody instanceof List<?> rawList) {
            return mapper.convertValue(rawList, new TypeReference<List<CatalogoResponse>>() {});
        }

        if (requestBody instanceof Map<?, ?> rawMap) {
            if (rawMap.containsKey("catalogo")) {
                return mapper.convertValue(rawMap.get("catalogo"), new TypeReference<List<CatalogoResponse>>() {});
            }

            if (rawMap.containsKey("record")) {
                Object record = rawMap.get("record");
                if (record instanceof Map<?, ?> recordMap && recordMap.containsKey("catalogo")) {
                    return mapper.convertValue(recordMap.get("catalogo"), new TypeReference<List<CatalogoResponse>>() {});
                }
            }
        }

        return Collections.emptyList();
    }
}