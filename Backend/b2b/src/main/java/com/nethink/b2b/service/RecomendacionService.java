package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.dto.response.ProductoRecomendadoDTO;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;
import com.nethink.b2b.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecomendacionService {

    private final ProductoRepository productoRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imgRepo;

    public RecomendacionService(
            ProductoRepository productoRepo,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imgRepo
    ) {
        this.productoRepo = productoRepo;
        this.specRepo = specRepo;
        this.imgRepo = imgRepo;
    }

    public List<ProductoRecomendadoDTO> listar() {

        List<Object[]> data = productoRepo.findTopProductos();

        List<Integer> ids = data.stream()
                .map(r -> ((Number) r[0]).intValue())
                .toList();

        List<ProductoEspecificacion> specs =
                specRepo.findByProducto_IdProductoIn(ids);

        List<ProductoImagen> imagenes =
                imgRepo.findByProducto_IdProductoIn(ids);

        Map<Integer, List<ProductoEspecificacion>> specMap =
                specs.stream().collect(Collectors.groupingBy(
                        s -> s.getProducto().getIdProducto()
                ));

        Map<Integer, List<ProductoImagen>> imgMap =
                imagenes.stream().collect(Collectors.groupingBy(
                        i -> i.getProducto().getIdProducto()
                ));

        return data.stream().map(r -> {

            Integer idProducto = ((Number) r[0]).intValue();

            String producto = (String) r[1];

            String descripcion = (String) r[2];

            String marca = (String) r[3];

            String categoria = (String) r[4];

            Integer vecesPedido = ((Number) r[5]).intValue();

            ProductoRecomendadoDTO dto =
                    new ProductoRecomendadoDTO();

            dto.setIdProducto(idProducto);
            dto.setProducto(producto);
            dto.setDescripcion(descripcion);
            dto.setMarca(marca);
            dto.setCategoria(categoria);
            dto.setVecesPedido(vecesPedido);

            List<EspecificacionResponse> specDTO =
                    specMap.getOrDefault(idProducto, List.of())
                            .stream()
                            .map(s -> {
                                EspecificacionResponse e =
                                        new EspecificacionResponse();

                                e.setNombre(s.getNombre());
                                e.setValor(s.getValor());

                                return e;
                            }).toList();

            List<ImagenResponse> imgDTO =
                    imgMap.getOrDefault(idProducto, List.of())
                            .stream()
                            .map(i -> {
                                ImagenResponse im =
                                        new ImagenResponse();

                                im.setUrl(i.getUrl());
                                im.setPrincipal(i.getPrincipal());
                                im.setOrden(i.getOrden());

                                return im;
                            }).toList();

            dto.setEspecificaciones(specDTO);
            dto.setImagenes(imgDTO);

            return dto;

        }).toList();
    }
}