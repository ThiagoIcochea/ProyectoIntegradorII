package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CatalogoService {

    private final ProductoRepository productoRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;

    public CatalogoService(ProductoRepository productoRepo,
                           ProductoEspecificacionRepository specRepo,
                           ProductoImagenRepository imagenRepo) {
        this.productoRepo = productoRepo;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
    }

    @Transactional(readOnly = true)
    public List<CatalogoResponse> listarCatalogo() {
       
        List<Producto> productos = productoRepo.findCatalogoBase();

        if (productos.isEmpty()) return new ArrayList<>();

        List<Integer> ids = productos.stream()
                .map(Producto::getIdProducto)
                .toList();

     
        List<ProductoEspecificacion> specs = specRepo.findByProducto_IdProductoIn(ids);
        List<ProductoImagen> imagenes = imagenRepo.findByProducto_IdProductoIn(ids);

      
        Map<Integer, List<ProductoEspecificacion>> specsByProd = specs.stream()
                .collect(Collectors.groupingBy(s -> s.getProducto().getIdProducto()));

        Map<Integer, List<ProductoImagen>> imagesByProd = imagenes.stream()
                .collect(Collectors.groupingBy(i -> i.getProducto().getIdProducto()));

        
        return productos.stream().map(p -> {
            CatalogoResponse r = new CatalogoResponse();
            r.setIdProducto(p.getIdProducto());
            r.setProducto(p.getNombre());
            r.setMarca(p.getMarca() != null ? p.getMarca().getNombre() : "Genérico");
            r.setCategoria(p.getCategoria() != null ? p.getCategoria().getNombre() : "Sin categoría");
            r.setDescripcion(p.getDescripcion());

           
            List<EspecificacionResponse> specDto = specsByProd.getOrDefault(p.getIdProducto(), new ArrayList<>())
                    .stream()
                    .map(e -> {
                        EspecificacionResponse er = new EspecificacionResponse();
                        er.setNombre(e.getNombre());
                        er.setValor(e.getValor());
                        return er;
                    }).toList();

          
            List<ImagenResponse> imgDto = imagesByProd.getOrDefault(p.getIdProducto(), new ArrayList<>())
                    .stream()
                    .map(img -> {
                        ImagenResponse ir = new ImagenResponse();
                        ir.setUrl(img.getUrl());
                        ir.setPrincipal(img.getPrincipal());
                        ir.setOrden(img.getOrden());
                        return ir;
                    }).toList();

            r.setEspecificaciones(specDto);
            r.setImagenes(imgDto);

            return r;
        }).toList();
    }

    public CatalogoResponse convertToResponse(Producto p) {
        CatalogoResponse r = new CatalogoResponse();
        r.setIdProducto(p.getIdProducto());
        r.setProducto(p.getNombre());
        r.setMarca(p.getMarca() != null ? p.getMarca().getNombre() : "Genérico");
        r.setCategoria(p.getCategoria() != null ? p.getCategoria().getNombre() : "Sin categoría");
        r.setDescripcion(p.getDescripcion());
        r.setEspecificaciones(new ArrayList<>());
        r.setImagenes(new ArrayList<>());
        return r;
    }
}
