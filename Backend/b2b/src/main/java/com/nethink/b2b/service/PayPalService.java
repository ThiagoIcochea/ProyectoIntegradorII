package com.nethink.b2b.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class PayPalService {

    @Value("${paypal_client_id}")
    private String clientId;

    @Value("${paypal_client_secret}")
    private String clientSecret;

    @Value("${paypal_base_url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // =========================
    // 1. OBTENER ACCESS TOKEN
    // =========================
    public String obtenerAccessToken() {

        try {
            String auth = clientId + ":" + clientSecret;

            String encodedAuth = Base64.getEncoder()
                    .encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", "Basic " + encodedAuth);

            HttpEntity<String> request =
                    new HttpEntity<>("grant_type=client_credentials", headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v1/oauth2/token",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody().get("access_token").toString();

        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo access token PayPal", e);
        }
    }

    // =========================
    // 2. CREAR ORDEN PAYPAL
    // =========================
    public Map crearOrden(String accessToken, String total, String returnUrl, String cancelUrl) {

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            Map<String, Object> body = new HashMap<>();
            body.put("intent", "CAPTURE");

            Map<String, Object> amount = new HashMap<>();
            amount.put("currency_code", "USD");
            amount.put("value", total);

            Map<String, Object> purchaseUnit = new HashMap<>();
            purchaseUnit.put("amount", amount);

            Map<String, Object> experienceContext = new HashMap<>();
            experienceContext.put("return_url", returnUrl != null && !returnUrl.isBlank()
                    ? returnUrl
                    : "https://proyectoinnovacion.onrender.com/api/suscripciones/success");
            experienceContext.put("cancel_url", cancelUrl != null && !cancelUrl.isBlank()
                    ? cancelUrl
                    : "https://proyectoinnovacion.onrender.com/api/suscripciones/cancel");

            Map<String, Object> paymentSource = new HashMap<>();
            paymentSource.put("paypal", Map.of("experience_context", experienceContext));

            body.put("purchase_units", List.of(purchaseUnit));
            body.put("payment_source", paymentSource);

            HttpEntity<Map> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody();

        } catch (Exception e) {
            throw new RuntimeException("Error creando orden PayPal", e);
        }
    }

    public Map capturarOrden(String accessToken, String orderId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            HttpEntity<String> request = new HttpEntity<>(null, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders/" + orderId + "/capture",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Error capturando la orden PayPal", e);
        }
    }

    // =========================
    // 3. OBTENER URL DE PAGO
    // =========================
    public String obtenerApprovalUrl(Map orderResponse) {
        try {
            Object linksValue = orderResponse.get("links");
            if (linksValue instanceof List<?> links) {
                for (Object linkObj : links) {
                    if (linkObj instanceof Map<?, ?> linkMap) {
                        Object rel = linkMap.get("rel");
                        Object href = linkMap.get("href");
                        if ("approve".equals(String.valueOf(rel)) && href != null) {
                            return href.toString();
                        }
                    }
                }
            }

            String orderId = String.valueOf(orderResponse.getOrDefault("id", ""));
            if (!orderId.isBlank()) {
                return "https://www.sandbox.paypal.com/checkoutnow?token=" + orderId;
            }

            throw new RuntimeException("No se encontró approval URL");
        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo approval URL", e);
        }
    }

    // =========================
    // 4. EXTRA: OBTENER ORDER ID
    // =========================
    public String obtenerOrderId(Map orderResponse) {
        return orderResponse.get("id").toString();
    }
}