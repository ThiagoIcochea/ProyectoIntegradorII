package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.ActualizarProductoRequest;
import com.nethink.b2b.dto.request.FiltroRFQRequest;
import com.nethink.b2b.dto.response.CatalogoFiltrosResponse;
import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.FiltroItemDTO;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.repository.ProductoRepository;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.repository.MarcaRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.dto.response.ProductoAdminResponse;
import com.nethink.b2b.entity.Categoria;
import com.nethink.b2b.entity.Marca;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.repository.ProductoImagenRepository;
import org.springframework.stereotype.Service;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.dto.request.ImagenProductoRequest;
import com.nethink.b2b.dto.response.CategoriaResponse;
import com.nethink.b2b.dto.response.MarcaResponse;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoImagenRepository productoImagenRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;
    private final ProductoEspecificacionRepository especificacionesRepository;
    private final CatalogoService catalogoService;
    private final Cloudinary cloudinary;

    public ProductoService(ProductoRepository productoRepository, 
                           CategoriaRepository categoriaRepository, 
                           MarcaRepository marcaRepository,
                           ProductoEspecificacionRepository especificacionesRepository,
                           ProductoImagenRepository productoImagenRepository,
                           CatalogoService catalogoService,
                           Cloudinary cloudinary) {
        this.productoRepository = productoRepository;
        this.productoImagenRepository = productoImagenRepository;
        this.categoriaRepository = categoriaRepository;
        this.marcaRepository = marcaRepository;
        this.especificacionesRepository = especificacionesRepository;
        this.catalogoService = catalogoService;
        this.cloudinary = cloudinary;
    }

    public List<Producto> listarProductos(String filtro) {
        if (filtro != null && !filtro.isEmpty()) {
            return productoRepository.findByNombreContainingIgnoreCase(filtro);
        }
        return productoRepository.findAll();
    }

    public CatalogoFiltrosResponse obtenerFiltrosCatalogo() {
        List<FiltroItemDTO> categorias = categoriaRepository.obtenerFiltrosConConteo();
        List<FiltroItemDTO> marcas = marcaRepository.obtenerFiltrosConConteo();
        return new CatalogoFiltrosResponse(categorias, marcas);
    }

   
    public List<CatalogoResponse> filtrarCatalogo(FiltroRFQRequest filtro) {
    
    if ((filtro.getCategorias() == null || filtro.getCategorias().isEmpty()) && 
        (filtro.getMarcas() == null || filtro.getMarcas().isEmpty()) &&
        (filtro.getEspecificaciones() == null || filtro.getEspecificaciones().isEmpty())) {
        return catalogoService.listarCatalogo(); 
    }

  
    List<Producto> productos = productoRepository.buscarConFiltros(
        filtro.getCategorias(), 
        filtro.getMarcas()
    );

    if (productos.isEmpty()) return new ArrayList<>();

    
    List<Integer> ids = productos.stream().map(Producto::getIdProducto).collect(Collectors.toList());
    List<ProductoEspecificacion> todasLasSpecs = especificacionesRepository.findByProducto_IdProductoIn(ids);
    Map<Integer, List<ProductoEspecificacion>> specsMap = todasLasSpecs.stream()
        .collect(Collectors.groupingBy(s -> s.getProducto().getIdProducto()));

    return productos.stream()
        .map(p -> {
            CatalogoResponse dto = mapToCatalogoResponse(p);
            List<ProductoEspecificacion> pSpecs = specsMap.getOrDefault(p.getIdProducto(), new ArrayList<>());
            dto.setEspecificaciones(pSpecs.stream()
                .map(s -> new EspecificacionResponse(s.getNombre(), s.getValor()))
                .collect(Collectors.toList()));
            return dto;
        })
        
        .filter(dto -> {
            if (filtro.getEspecificaciones() == null || filtro.getEspecificaciones().isEmpty()) return true;
            
        
            return filtro.getEspecificaciones().stream().allMatch(busqueda -> 
                dto.getEspecificaciones().stream().anyMatch(s -> 
                    (s.getNombre() + " " + s.getValor()).toLowerCase().contains(busqueda.toLowerCase())
                )
            );
        })
        .collect(Collectors.toList());
}



    private CatalogoResponse mapToCatalogoResponse(Producto p) {
        CatalogoResponse resp = new CatalogoResponse();
        resp.setIdProducto(p.getIdProducto());
        resp.setProducto(p.getNombre());
        resp.setMarca(p.getMarca() != null ? p.getMarca().getNombre() : "Genérico");
        resp.setCategoria(p.getCategoria() != null ? p.getCategoria().getNombre() : "Sin categoría");
        resp.setDescripcion(p.getDescripcion());
        resp.setEspecificaciones(new ArrayList<>());
        return resp;
    }
    
    public List<ProductoAdminResponse> obtenerProductosAdmin() {

    List<Object[]> rows = productoRepository.obtenerProductosAdmin();

    List<CategoriaResponse> categories = categoriaRepository.findAll()
        .stream()
        .map(c -> new CategoriaResponse(
                c.getIdCategoria(),
                c.getNombre()))
        .toList();

    List<MarcaResponse> marks = marcaRepository.findAll()
        .stream()
        .map(m -> new MarcaResponse(
                m.getIdMarca(),
                m.getNombre()))
        .toList();

    List<Integer> idsProductos = rows.stream()
        .filter(row -> row != null && row.length > 0)
        .map(row -> safeInteger(row[0]))
        .distinct()
        .toList();

    Map<Integer, List<ProductoImagen>> imagenesPorProducto = productoImagenRepository.findByProducto_IdProductoIn(idsProductos)
        .stream()
        .collect(Collectors.groupingBy(img -> img.getProducto().getIdProducto()));

    return rows.stream().filter(row -> row != null && row.length > 0).map(row -> {
        Integer idProducto = safeInteger(row[0]);
        ProductoAdminResponse dto = new ProductoAdminResponse();

        Integer providersCount = safeInteger(row[5]);
        Integer totalStock = safeInteger(row[6]);
        String dbStatus = safeString(row[7]);
        String status = (dbStatus == null || dbStatus.isBlank()) ? "ACTIVO" : dbStatus.trim();

        dto.setStatus(normalizarEstado(status));
        dto.setIdProducto(idProducto);
        dto.setName(safeString(row[1]));
        dto.setSkuGlobal(safeString(row[2]));
        dto.setBrand(safeString(row[3]));
        dto.setCategory(safeString(row[4]));
        dto.setProvidersCount(providersCount);
        dto.setTotalStock(totalStock);

        List<ProductoImagen> imgs = imagenesPorProducto.getOrDefault(idProducto, List.of());
        List<ImagenResponse> images = imgs.stream()
            .map(img -> new ImagenResponse(img.getUrl(), img.getPrincipal()))
            .toList();
        dto.setImages(images);
        dto.setCategorias(categories);
        dto.setMarcas(marks);
        return dto;
    }).toList();
}

private String normalizarEstado(String status) {
    String normalized = status == null ? "ACTIVO" : status.trim().toUpperCase();
    if (normalized.startsWith("INACT")) {
        return "Inactivo";
    }
    if (normalized.startsWith("BAJO")) {
        return "Bajo stock";
    }
    if (normalized.startsWith("STOCK")) {
        return "Stock medio";
    }
    return "Activo";
}

private Integer safeInteger(Object value) {
    if (value == null) return 0;
    if (value instanceof Number number) return number.intValue();
    try {
        return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
        return 0;
    }
}

private String safeString(Object value) {
    return value == null ? null : String.valueOf(value).trim();
}
    
 private String subirACloudinary(MultipartFile archivo) throws IOException {

    Map uploadResult = cloudinary.uploader().upload(
            archivo.getBytes(),
            ObjectUtils.asMap(
                    "folder", "b2b/productos"
            )
    );

    return uploadResult.get("secure_url").toString();
}
    
@Transactional
public void actualizarProducto(ActualizarProductoRequest request) throws IOException {

    Producto producto = productoRepository
            .findById(request.getIdProducto())
            .orElseThrow();

    producto.setNombre(request.getNombre());

    Marca marca = marcaRepository.findByNombre(request.getMarca()).orElseThrow();
    Categoria categoria = categoriaRepository.findByNombre(request.getCategoria()).orElseThrow();

    producto.setMarca(marca);
    producto.setCategoria(categoria);
    producto.setEstado(request.getEstado());

    productoRepository.save(producto);

   
    if (request.getImagenes() != null) {

       
        List<ProductoImagen> actuales =
                productoImagenRepository.findByProducto_IdProducto(producto.getIdProducto());

        productoImagenRepository.deleteAll(actuales);

        
        List<ProductoImagen> nuevas = new ArrayList<>();

for (ImagenProductoRequest imgReq : request.getImagenes()) {
    
    System.out.println("Archivo: " + imgReq.getArchivo());
    System.out.println("URL: " + imgReq.getUrl());

    ProductoImagen img = new ProductoImagen();
    img.setProducto(producto);

    if (imgReq.getArchivo() != null && !imgReq.getArchivo().isEmpty()) {

        String url = subirACloudinary(imgReq.getArchivo());
        img.setUrl(url);

    } else {

        img.setUrl(imgReq.getUrl());

    }

    img.setPrincipal(Boolean.TRUE.equals(imgReq.getPrincipal()));

    nuevas.add(img);
}

productoImagenRepository.saveAll(nuevas);
    }
}
}
