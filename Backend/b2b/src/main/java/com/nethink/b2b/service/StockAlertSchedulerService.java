package com.nethink.b2b.service;

import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockAlertSchedulerService {

    private final ProveedorProductoRepository proveedorProductoRepo;
    private final EmailService emailService;

    public StockAlertSchedulerService(
            ProveedorProductoRepository proveedorProductoRepo,
            EmailService emailService
    ) {
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.emailService = emailService;
    }
    
        @Scheduled(fixedRate = 600000) 
    public void revisarStock() {

        System.out.println("\n=== RUTINA ALERTA STOCK INICIADA ===");

        List<ProveedorProducto> productos =
                proveedorProductoRepo.findAll();

        if (productos.isEmpty()) {
            System.out.println("No hay productos para revisar stock");
            return;
        }

        for (ProveedorProducto pp : productos) {

            try {

                Integer stock = pp.getStock();

                if (stock == null) continue;

                
                if (stock <= 0) {
                    emailService.enviarAlertaSinStock(pp);
                    continue;
                }

               
                if (stock <= 10) {
                    emailService.enviarAlertaStockBajo(pp);
                }

            } catch (Exception e) {
                System.out.println(
                        "Error revisando stock de producto ID: "
                                + pp.getIdProvProd()
                );
                e.printStackTrace();
            }
        }

        System.out.println("=== RUTINA ALERTA STOCK FINALIZADA ===\n");
    }
}
