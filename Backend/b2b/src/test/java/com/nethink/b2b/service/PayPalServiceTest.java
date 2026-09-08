package com.nethink.b2b.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PayPalServiceTest {

    @Test
    void debeRetornarApprovalUrlCuandoElResponseTieneRelApprove() {
        PayPalService payPalService = new PayPalService();
        ReflectionTestUtils.setField(payPalService, "baseUrl", "https://api-m.sandbox.paypal.com");

        Map<String, Object> response = Map.of(
                "id", "ORDER_123",
                "links", List.of(
                        Map.of("rel", "self", "href", "https://api.sandbox.paypal.com/v2/checkout/orders/ORDER_123"),
                        Map.of("rel", "approve", "href", "https://www.sandbox.paypal.com/checkoutnow?token=ORDER_123")
                )
        );

        String approvalUrl = payPalService.obtenerApprovalUrl(response);

        assertThat(approvalUrl).isEqualTo("https://www.sandbox.paypal.com/checkoutnow?token=ORDER_123");
    }

    @Test
    void debeConstruirApprovalUrlFallbackCuandoNoVieneElLinkApprove() {
        PayPalService payPalService = new PayPalService();
        ReflectionTestUtils.setField(payPalService, "baseUrl", "https://api-m.sandbox.paypal.com");

        Map<String, Object> response = Map.of(
                "id", "ORDER_456"
        );

        String approvalUrl = payPalService.obtenerApprovalUrl(response);

        assertThat(approvalUrl).isEqualTo("https://www.sandbox.paypal.com/checkoutnow?token=ORDER_456");
    }
}
