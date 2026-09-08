package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.PublicidadResponse;
import com.nethink.b2b.entity.Publicidad;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.repository.DetalleSolicitudRepository;
import com.nethink.b2b.repository.PublicidadRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PublicidadService {

    private final PublicidadRepository repository;
    private final DetalleSolicitudRepository detalleSolicitudRepository;
    private final ProductoImagenRepository productoImagenRepository;

    public PublicidadService(
            PublicidadRepository repository,
            DetalleSolicitudRepository detalleSolicitudRepository,
            ProductoImagenRepository productoImagenRepository
    ) {
        this.repository = repository;
        this.detalleSolicitudRepository = detalleSolicitudRepository;
        this.productoImagenRepository = productoImagenRepository;
    }

public List<PublicidadResponse> listarActivas() {

    LocalDateTime now = LocalDateTime.now();

    List<Publicidad> lista = repository.findActivas(
            Publicidad.Estado.ACTIVO,
            now
    );

    List<PublicidadResponse> activas = lista.stream().map(p -> {

        PublicidadResponse dto = new PublicidadResponse();

        dto.setIdPublicidad(p.getIdPublicidad());
        dto.setTitulo(p.getTitulo());
        dto.setImagen(p.getImagen());
        dto.setEnlace(p.getEnlace());

        dto.setProveedor(
                p.getProveedor() != null
                        ? p.getProveedor().getRazonSocial()
                        : "Interno"
        );
        dto.setIdProveedor(p.getProveedor() != null ? p.getProveedor().getIdProveedor() : null);

        dto.setOrigen(p.getOrigen().name());
        dto.setFechaInicio(p.getFechaInicio());
        dto.setFechaFin(p.getFechaFin());

        return dto;

    }).toList();

    List<DetalleSolicitudRepository.PremiumTopProductRow> topProductos =
            detalleSolicitudRepository.listarTopProductosPremium();

    Map<Integer, String> imagenes = topProductos.isEmpty()
            ? Map.of()
            : productoImagenRepository.findByProducto_IdProductoIn(
                    topProductos.stream()
                            .map(DetalleSolicitudRepository.PremiumTopProductRow::getIdProducto)
                            .distinct()
                            .toList()
            ).stream()
            .collect(Collectors.toMap(
                    imagen -> imagen.getProducto().getIdProducto(),
                    ProductoImagen::getUrl,
                    (actual, siguiente) -> actual
            ));

    List<PublicidadResponse> premium = topProductos.stream()
            .map(row -> {
                PublicidadResponse dto = new PublicidadResponse();
                dto.setIdPublicidad(-1 * ((row.getIdProveedor() * 100) + row.getRanking()));
                dto.setTitulo("Top " + row.getRanking() + " en " + row.getProveedor() + ": " + row.getProducto());
                dto.setImagen(imagenes.get(row.getIdProducto()));
                dto.setEnlace("/app/rfq/product/" + row.getIdProducto());
                dto.setProveedor(row.getProveedor());
                dto.setOrigen("PROVEEDOR_PREMIUM");
                dto.setIdProveedor(row.getIdProveedor());
                dto.setIdProducto(row.getIdProducto());
                dto.setProducto(row.getProducto());
                dto.setRanking(row.getRanking());
                dto.setUnidadesVendidas(row.getUnidadesVendidas());
                dto.setFechaInicio(now);
                dto.setFechaFin(null);
                return dto;
            })
            .toList();

    return java.util.stream.Stream.concat(premium.stream(), activas.stream()).toList();
}
}
