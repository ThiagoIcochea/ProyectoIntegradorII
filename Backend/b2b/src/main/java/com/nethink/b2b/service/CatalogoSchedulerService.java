package com.nethink.b2b.service;

import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.ProveedorRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CatalogoSchedulerService {

    private final SyncCatalogoService syncService;
    private final ProveedorRepository proveedorRepo;

    public CatalogoSchedulerService(
            SyncCatalogoService syncService,
            ProveedorRepository proveedorRepo
    ) {

        this.syncService = syncService;
        this.proveedorRepo = proveedorRepo;
    }

    @Scheduled(fixedRate = 60000)
    public void sincronizarCatalogos() {

        System.out.println(
                "\n===================================="
        );

        System.out.println(
                "SINCRONIZACION INICIADA"
        );

        System.out.println(
                "Fecha: " + LocalDateTime.now()
        );

        System.out.println(
                "===================================="
        );

        List<Proveedor> proveedores =
                proveedorRepo.findByEstado(
                        "ACTIVO"
                );

        if (proveedores.isEmpty()) {

            System.out.println(
                    "No existen proveedores activos"
            );

            return;
        }

        for (Proveedor proveedor : proveedores) {

            try {

                System.out.println(
                        "\nProveedor: "
                                + proveedor.getRazonSocial()
                );

                System.out.println(
                        "API: "
                                + proveedor.getApiUrl()
                );

                System.out.println(
                        "Tipo API: "
                                + proveedor.getApiTipo()
                );

                syncService.sincronizarProveedor(
                        proveedor
                );

                System.out.println(
                        "Sincronizacion completada"
                );

            } catch (Exception e) {

                System.out.println(
                        "Error sincronizando proveedor: "
                                + proveedor.getRazonSocial()
                );

                System.out.println(
                        "Detalle: "
                                + e.getMessage()
                );

                e.printStackTrace();
            }
        }

        System.out.println(
                "\n===================================="
        );

        System.out.println(
                "SINCRONIZACION FINALIZADA"
        );

        System.out.println(
                "====================================\n"
        );
    }
}