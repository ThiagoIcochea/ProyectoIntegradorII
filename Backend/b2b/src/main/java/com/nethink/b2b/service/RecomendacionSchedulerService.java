package com.nethink.b2b.service;

import com.nethink.b2b.entity.Recomendacion;
import com.nethink.b2b.repository.ProductoRepository;
import com.nethink.b2b.repository.RecomendacionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecomendacionSchedulerService {

    private final ProductoRepository productoRepo;
    private final RecomendacionRepository recomendacionRepo;

    public RecomendacionSchedulerService(
            ProductoRepository productoRepo,
            RecomendacionRepository recomendacionRepo
    ) {
        this.productoRepo = productoRepo;
        this.recomendacionRepo = recomendacionRepo;
    }

    @Transactional
    public void recalcularRecomendados() {

        recomendacionRepo.deleteAllInBatch();

        List<Object[]> data = productoRepo.findTopProductos();

        List<Recomendacion> lista = data.stream().map(r -> {

            Recomendacion rec = new Recomendacion();

            rec.setIdProducto(((Number) r[0]).intValue());

            rec.setScore(((Number) r[5]).doubleValue());

            rec.setTipo("POPULARIDAD");

            rec.setFechaCalculo(LocalDateTime.now());

            return rec;

        }).toList();

        recomendacionRepo.saveAll(lista);
    }
}