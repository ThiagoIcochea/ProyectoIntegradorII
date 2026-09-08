package com.nethink.b2b.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SyncCatalogoService {

    private final ProductoRepository productoRepo;
    private final MarcaRepository marcaRepo;
    private final CategoriaRepository categoriaRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;
    private final DescuentoVolumenRepository descuentoRepo;
    private final ApiConfiguracionService apiConfSer;

    private final RestTemplate restTemplate;

    public SyncCatalogoService(
            ProductoRepository productoRepo,
            MarcaRepository marcaRepo,
            CategoriaRepository categoriaRepo,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo,
            ProveedorProductoRepository proveedorProductoRepo,
            DescuentoVolumenRepository descuentoRepo,
            ApiConfiguracionService apiConfSer
    ) {
        this.productoRepo = productoRepo;
        this.marcaRepo = marcaRepo;
        this.categoriaRepo = categoriaRepo;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.descuentoRepo = descuentoRepo;
        this.restTemplate = new RestTemplate();
        this.apiConfSer= apiConfSer;
    }

    private String normalizarUrlProveedor(Proveedor proveedor) {

        String url = proveedor.getApiUrl();

        if (url == null) return null;

        boolean esJsonBin = url.contains("jsonbin.io");

        if (!esJsonBin) return url;

        if (url.contains("/latest")) return url;

        return url.endsWith("/") ? url + "latest" : url + "/latest";
    }

    public void sincronizarProveedor(Proveedor proveedor) {

        try {

            System.out.println("Conectando con proveedor: " + proveedor.getRazonSocial());

            List<CatalogoResponse> catalogo;

            if ("GRAPHQL".equalsIgnoreCase(proveedor.getApiTipo())) {
                catalogo = consumirGraphQL(proveedor);
            } else {
                catalogo = consumirRest(proveedor);
            }

            if (catalogo == null || catalogo.isEmpty()) {
                System.out.println("Proveedor sin catálogo: " + proveedor.getRazonSocial());
                return;
            }

            for (CatalogoResponse dto : catalogo) {
                sync(dto, proveedor);
            }

            System.out.println("Sincronización completada: " + proveedor.getRazonSocial());

        } catch (Exception e) {
            System.out.println("No se pudo conectar con proveedor: " + proveedor.getRazonSocial());
            apiConfSer.probarConexion(proveedor.getUsuario().getCorreo());
            e.printStackTrace();
        }
    }

   private List<CatalogoResponse> consumirRest(Proveedor proveedor) {

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
        headers.setBearerAuth(proveedor.getApiToken());
    }

    HttpEntity<String> entity = new HttpEntity<>(headers);

    String url = normalizarUrlProveedor(proveedor);

    ResponseEntity<Map> response =
            restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

    if (response.getBody() == null) return Collections.emptyList();

    Object data = response.getBody();

    Object catalogoObj = null;

    if (data instanceof Map<?, ?> map) {

        if (map.containsKey("record")) {
            // SOLO JSONBIN
            Map record = (Map) map.get("record");
            catalogoObj = record.get("catalogo");
        } else if (map.containsKey("catalogo")) {
            // API normal con wrapper catalogo
            catalogoObj = map.get("catalogo");
        } else {
            // API directa: array raíz
            catalogoObj = map;
        }
    }

    if (catalogoObj == null) return Collections.emptyList();

    return new ObjectMapper()
            .convertValue(
                    catalogoObj,
                    new com.fasterxml.jackson.core.type.TypeReference<List<CatalogoResponse>>() {}
            );
}

    private List<CatalogoResponse> consumirGraphQL(Proveedor proveedor) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
            headers.setBearerAuth(proveedor.getApiToken());
        }

        String query = """
        {
          "query": "query { catalogo { sku producto marca categoria descripcion precioUnitario stock garantiaMeses tiempoEntregaDias enOferta porcentajeDescuento estado imagenes { url principal orden } especificaciones { nombre valor } descuentosVolumen { cantidadMin precioUnitario } } }"
        }
        """;

        HttpEntity<String> entity = new HttpEntity<>(query, headers);

        ResponseEntity<GraphQLCatalogoResponse> response =
                restTemplate.exchange(
                        proveedor.getApiUrl(),
                        HttpMethod.POST,
                        entity,
                        GraphQLCatalogoResponse.class
                );

        if (response.getBody() == null || response.getBody().getData() == null) {
            return Collections.emptyList();
        }

        return response.getBody().getData().getCatalogo();
    }

    public void sync(CatalogoResponse dto, Proveedor proveedor) {

        Marca marca = obtenerOCrearMarca(dto.getMarca());
        Categoria categoria = obtenerOCrearCategoria(dto.getCategoria());

        Producto producto = buscarProductoExistente(dto, marca, categoria);

        boolean productoNuevo = false;

        if (producto == null) {
            producto = crearProducto(dto, marca, categoria, proveedor);
            productoNuevo = true;
        } else {
            actualizarProducto(producto, dto, marca, categoria, proveedor);
        }

        actualizarSkuEnProveedor(proveedor, dto, producto);

        if (productoNuevo) {
            sincronizarEspecificaciones(producto, dto.getEspecificaciones());
            sincronizarImagenes(producto, dto.getImagenes());
        }

        sincronizarProveedorProducto(producto, proveedor, dto);
    }

    private Marca obtenerOCrearMarca(String nombre) {

        return marcaRepo.findByNombre(nombre)
                .orElseGet(() -> {
                    Marca m = new Marca();
                    m.setNombre(nombre);
                    return marcaRepo.save(m);
                });
    }

    private Categoria obtenerOCrearCategoria(String nombre) {

        return categoriaRepo.findByNombre(nombre)
                .orElseGet(() -> {
                    Categoria c = new Categoria();
                    c.setNombre(nombre);
                    return categoriaRepo.save(c);
                });
    }

    private Producto buscarProductoExistente(CatalogoResponse dto, Marca marca, Categoria categoria) {

        if (dto.getSku() != null && !dto.getSku().isBlank()) {
            Optional<Producto> porSku = productoRepo.findBySkuGlobal(dto.getSku());
            if (porSku.isPresent()) return porSku.get();
        }

        Optional<Producto> producto =
                productoRepo.findByNombreAndMarca_IdMarca(dto.getProducto(), marca.getIdMarca());

        if (producto.isPresent()) {

            Producto existente = producto.get();

            boolean categoriaIgual =
                    existente.getCategoria().getIdCategoria().equals(categoria.getIdCategoria());

            boolean specsIguales =
                    compararEspecificaciones(existente.getIdProducto(), dto.getEspecificaciones());

            if (categoriaIgual || specsIguales) {

                if ((existente.getSkuGlobal() == null || existente.getSkuGlobal().isBlank())
                        && dto.getSku() != null && !dto.getSku().isBlank()) {

                    existente.setSkuGlobal(dto.getSku());
                    productoRepo.save(existente);
                }

                return existente;
            }
        }

        return null;
    }

    private boolean compararEspecificaciones(Integer idProducto, List<EspecificacionResponse> nuevas) {

        List<ProductoEspecificacion> actuales =
                specRepo.findByProducto_IdProducto(idProducto);

        if (nuevas == null || actuales.isEmpty()) return false;

        int coincidencias = 0;

        for (EspecificacionResponse n : nuevas) {
            for (ProductoEspecificacion a : actuales) {

                boolean nombre = a.getNombre().equalsIgnoreCase(n.getNombre());
                boolean valor = a.getValor().equalsIgnoreCase(n.getValor());

                if (nombre && valor) coincidencias++;
            }
        }

        return coincidencias >= 2;
    }

    private Producto crearProducto(CatalogoResponse dto, Marca marca, Categoria categoria, Proveedor proveedor) {

        Producto producto = new Producto();

        producto.setNombre(dto.getProducto());
        producto.setDescripcion(dto.getDescripcion());
        producto.setMarca(marca);
        producto.setCategoria(categoria);
        producto.setEstado(dto.getEstado() != null ? dto.getEstado() : "ACTIVO");
        producto.setFuente("API");
        producto.setApiOrigen(proveedor.getApiUrl());
        producto.setFechaActualizacion(LocalDateTime.now());

        if (dto.getSku() != null && !dto.getSku().isBlank()) {
            producto.setSkuGlobal(dto.getSku());
        }

        Producto guardado = productoRepo.save(producto);

        if (guardado.getSkuGlobal() == null || guardado.getSkuGlobal().isBlank()) {
            guardado.setSkuGlobal("NTK-" + String.format("%06d", guardado.getIdProducto()));
            guardado = productoRepo.save(guardado);
        }

        return guardado;
    }

    private void actualizarProducto(Producto producto, CatalogoResponse dto, Marca marca, Categoria categoria, Proveedor proveedor) {

        producto.setNombre(dto.getProducto());
        producto.setDescripcion(dto.getDescripcion());
        producto.setMarca(marca);
        producto.setCategoria(categoria);
        producto.setEstado(dto.getEstado() != null ? dto.getEstado() : producto.getEstado());
        producto.setApiOrigen(proveedor.getApiUrl());
        producto.setFechaActualizacion(LocalDateTime.now());

        productoRepo.save(producto);
    }

    private void sincronizarEspecificaciones(Producto producto, List<EspecificacionResponse> specs) {

        specRepo.deleteByProducto_IdProducto(producto.getIdProducto());

        if (specs == null) return;

        for (EspecificacionResponse e : specs) {

            ProductoEspecificacion spec = new ProductoEspecificacion();
            spec.setProducto(producto);
            spec.setNombre(e.getNombre());
            spec.setValor(e.getValor());
            specRepo.save(spec);
        }
    }

    private void sincronizarImagenes(Producto producto, List<ImagenResponse> imagenes) {

        imagenRepo.deleteByProducto_IdProducto(producto.getIdProducto());

        if (imagenes == null) return;

        

        for (ImagenResponse img : imagenes) {

            ProductoImagen imagen = new ProductoImagen();
            imagen.setProducto(producto);
            imagen.setUrl(img.getUrl());
            imagen.setPrincipal(Boolean.TRUE.equals(img.getPrincipal()));
            imagen.setOrden(img.getOrden());
            imagenRepo.save(imagen);
        }
    }

    private void sincronizarProveedorProducto(Producto producto, Proveedor proveedor, CatalogoResponse dto) {

        ProveedorProducto pp =
                proveedorProductoRepo.buscarPorProveedorYProducto(
                        proveedor.getIdProveedor(),
                        producto.getIdProducto()
                ).orElseGet(() -> {
                    ProveedorProducto n = new ProveedorProducto();
                    n.setProveedor(proveedor);
                    n.setProducto(producto);
                    return n;
                });

        pp.setPrecio(dto.getPrecioUnitario());
        pp.setStock(dto.getStock());
        pp.setGarantiaMeses(dto.getGarantiaMeses());
        pp.setTiempoEntregaDias(dto.getTiempoEntregaDias());
        pp.setEnOferta(dto.getEnOferta());
        pp.setPorcentajeDescuento(dto.getPorcentajeDescuento());
        pp.setUltimaActualizacionStock(LocalDateTime.now());

        pp = proveedorProductoRepo.save(pp);

        sincronizarDescuentos(pp, dto.getDescuentosVolumen());
    }

    private void sincronizarDescuentos(ProveedorProducto pp, List<DescuentoVolumenResponse> descuentos) {

        descuentoRepo.deleteByProveedorProducto_IdProvProd(pp.getIdProvProd());

        if (descuentos == null) return;

        for (DescuentoVolumenResponse d : descuentos) {

            DescuentoVolumen dv = new DescuentoVolumen();
            dv.setProveedorProducto(pp);
            dv.setCantidadMin(d.getCantidadMin());
            dv.setPrecioUnitario(d.getPrecioUnitario());
            descuentoRepo.save(dv);
        }
    }

    private void actualizarSkuEnProveedor(Proveedor proveedor, CatalogoResponse dto, Producto producto) {

        try {

            if (dto.getSku() != null && !dto.getSku().isBlank()) return;

            if ("GRAPHQL".equalsIgnoreCase(proveedor.getApiTipo())) {
                actualizarSkuGraphQL(proveedor, dto, producto);
            } else {
                actualizarSkuRest(proveedor, dto, producto);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void actualizarSkuRest(Proveedor proveedor, CatalogoResponse dto, Producto producto) {

        try {

            dto.setSku(producto.getSkuGlobal());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
                headers.setBearerAuth(proveedor.getApiToken());
            }

            Map<String, Object> body = new HashMap<>();
            body.put("catalogo", List.of(dto));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            try {
                restTemplate.exchange(proveedor.getApiUrl(), HttpMethod.PUT, entity, String.class);
            } catch (Exception putError) {
                try {
                    restTemplate.exchange(proveedor.getApiUrl(), HttpMethod.POST, entity, String.class);
                } catch (Exception postError) {
                    throw postError;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void actualizarSkuGraphQL(Proveedor proveedor, CatalogoResponse dto, Producto producto) {

        try {

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
                headers.setBearerAuth(proveedor.getApiToken());
            }

            String mutation = """
            {
              "query": "mutation { actualizarSku(idProducto: %d, sku: \\\"%s\\\") }"
            }
            """.formatted(dto.getIdProducto(), producto.getSkuGlobal());

            HttpEntity<String> entity = new HttpEntity<>(mutation, headers);

            restTemplate.exchange(proveedor.getApiUrl(), HttpMethod.POST, entity, String.class);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}