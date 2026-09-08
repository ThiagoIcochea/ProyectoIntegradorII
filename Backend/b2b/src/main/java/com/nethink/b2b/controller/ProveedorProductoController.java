package com.nethink.b2b.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.service.ProveedorProductoService;
import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedor-productos")
public class ProveedorProductoController {

    private final ProveedorProductoService service;

    public ProveedorProductoController(ProveedorProductoService service) {
        this.service = service;
    }

    @GetMapping("/mis-productos")
    public List<ProveedorProductoResponse> listar(Principal principal) {
        return service.listarProductosPorProveedor(principal.getName());
    }

    @PostMapping("/mis-productos")
    public Object crear(@RequestBody Object requestBody, Principal principal) {
        List<CatalogoResponse> catalogo = parseCatalogoList(requestBody);
        if (!catalogo.isEmpty()) {
            return service.crearOModificarCatalogoProveedor(principal.getName(), catalogo);
        }

        CatalogoResponse producto = parseCatalogoRequest(requestBody);
        return service.crearProductoProveedor(principal.getName(), producto);
    }

    @PutMapping("/mis-productos")
    public List<ProveedorProductoResponse> actualizarCatalogoPut(@RequestBody Object requestBody, Principal principal) {
        return actualizarCatalogoCompleto(requestBody, principal);
    }

    @PatchMapping("/mis-productos")
    public List<ProveedorProductoResponse> actualizarCatalogoPatch(@RequestBody Object requestBody, Principal principal) {
        return actualizarCatalogoCompleto(requestBody, principal);
    }

    @PutMapping("/mis-productos/{idProvProd}")
    public ProveedorProductoResponse actualizarPut(@PathVariable Integer idProvProd, @RequestBody Object requestBody, Principal principal) {
        return service.actualizarProductoProveedor(principal.getName(), idProvProd, parseCatalogoRequest(requestBody));
    }

    @PatchMapping("/mis-productos/{idProvProd}")
    public ProveedorProductoResponse actualizarPatch(@PathVariable Integer idProvProd, @RequestBody Object requestBody, Principal principal) {
        return service.actualizarProductoProveedor(principal.getName(), idProvProd, parseCatalogoRequest(requestBody));
    }

    private List<ProveedorProductoResponse> actualizarCatalogoCompleto(Object requestBody, Principal principal) {
        List<CatalogoResponse> catalogo = parseCatalogoList(requestBody);
        if (catalogo.isEmpty()) {
            throw new IllegalArgumentException("El catálogo debe incluir al menos un producto.");
        }

        return service.crearOModificarCatalogoProveedor(principal.getName(), catalogo);
    }

    private CatalogoResponse parseCatalogoRequest(Object requestBody) {
        if (requestBody == null) {
            return new CatalogoResponse();
        }

        ObjectMapper mapper = new ObjectMapper();
        if (requestBody instanceof Map<?, ?> rawMap) {
            if (rawMap.containsKey("catalogo")) {
                Object catalogo = rawMap.get("catalogo");
                if (catalogo instanceof List<?> items && !items.isEmpty()) {
                    return mapper.convertValue(items.get(0), CatalogoResponse.class);
                }
            }
            if (rawMap.containsKey("producto") || rawMap.containsKey("marca") || rawMap.containsKey("categoria")) {
                return mapper.convertValue(rawMap, CatalogoResponse.class);
            }
        }

        return mapper.convertValue(requestBody, CatalogoResponse.class);
    }

    private List<CatalogoResponse> parseCatalogoList(Object requestBody) {
        if (requestBody == null) {
            return Collections.emptyList();
        }

        ObjectMapper mapper = new ObjectMapper();
        if (requestBody instanceof Map<?, ?> rawMap) {
            if (rawMap.containsKey("catalogo")) {
                Object catalogo = rawMap.get("catalogo");
                return mapper.convertValue(catalogo, new TypeReference<List<CatalogoResponse>>() {});
            }
        }

        if (requestBody instanceof List<?>) {
            return mapper.convertValue(requestBody, new TypeReference<List<CatalogoResponse>>() {});
        }

        CatalogoResponse single = parseCatalogoRequest(requestBody);
        return single == null ? Collections.emptyList() : List.of(single);
    }
}
