package com.nethink.b2b.job;

import com.nethink.b2b.service.RecomendacionSchedulerService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecomendacionJob {

    private final RecomendacionSchedulerService service;

    public RecomendacionJob(RecomendacionSchedulerService service) {
        this.service = service;
    }

    @Scheduled(fixedRate = 3600000)
    public void ejecutarRecomendaciones() {
        service.recalcularRecomendados();
    }
}