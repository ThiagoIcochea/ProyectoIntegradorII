package com.nethink.b2b.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.request.GroqMessage;
import com.nethink.b2b.dto.request.GroqRequest;
import com.nethink.b2b.dto.response.VoiceAssistantResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ConfiguracionRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class VoiceAssistantService {

    private final ConfiguracionRepository configRepository;
    private final UsuarioRepository usuarioRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VoiceAssistantService(ConfiguracionRepository configRepository, UsuarioRepository usuarioRepository) {
        this.configRepository = configRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public VoiceAssistantResponse respond(String correo, String text, String currentPath) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String rol = usuario.getRol().getNombre().toUpperCase().replace("ROLE_", "");
        String nombre = (usuario.getNombres() + " " + usuario.getApellidos()).trim();
        String prompt = buildPrompt(nombre, rol, currentPath, text);

        try {
            Configuracion config = configRepository.findByClave("AI_COMMENTS").orElseThrow();
            String apiKey = config.getValor();

            GroqMessage system = new GroqMessage();
            system.setRole("system");
            system.setContent(prompt);

            GroqRequest requestBody = new GroqRequest();
            requestBody.setModel("openai/gpt-oss-20b");
            requestBody.setTemperature(0.25);
            requestBody.setMessages(List.of(system));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return objectMapper.readValue(content, VoiceAssistantResponse.class);
        } catch (Exception e) {
            VoiceAssistantResponse fallback = new VoiceAssistantResponse();
            fallback.setAction("NONE");
            fallback.setAnswer("Puedo ayudarte a navegar, buscar y preparar acciones segun tu rol, pero ahora no pude consultar la IA. Intenta de nuevo en unos segundos.");
            return fallback;
        }
    }

    public Map<String, String> providerInsights(String correo, Map<String, Object> stats) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String prompt = """
                Eres analista senior de performance B2B para proveedores peruanos de infraestructura/redes. Analiza estas metricas reales y entrega recomendaciones concretas para Peru.
                Proveedor: %s %s
                Estadisticas JSON: %s

                Reglas obligatorias:
                - Responde en espanol peruano, tono ejecutivo y accionable.
                - Usa moneda peruana: soles, formato S/ 0.00. Nunca uses USD, dolares, k USD ni simbolos de otra moneda.
                - Devuelve un solo parrafo de recomendacion general, sin enumerar, sin bullets y sin titulos en negrita.
                - Explica de forma integrada como mejorar aprobaciones, pendientes, reclamos, API e ingresos segun los datos disponibles.
                - No uses secciones como diagnostico, riesgos o acciones adicionales.
                - Maximo 120 palabras.
                """.formatted(usuario.getNombres(), usuario.getApellidos(), stats);

        try {
            Configuracion config = configRepository.findByClave("AI_COMMENTS").orElseThrow();
            String apiKey = config.getValor();

            GroqMessage system = new GroqMessage();
            system.setRole("user");
            system.setContent(prompt);

            GroqRequest requestBody = new GroqRequest();
            requestBody.setModel("openai/gpt-oss-20b");
            requestBody.setTemperature(0.45);
            requestBody.setMessages(List.of(system));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return Map.of("analysis", normalizeInsightParagraph(content));
        } catch (Exception e) {
            return Map.of("analysis", "Para mejorar el rendimiento, prioriza una revision diaria de pagos y solicitudes pendientes, define responsables claros para responder cada RFQ dentro de un plazo corto y conecta la API para mantener stock, precios y estados actualizados sin reprocesos manuales. Tambien conviene cerrar reclamos con evidencia y resoluciones claras para proteger la confianza del cliente, mientras enfocas la atencion comercial en las oportunidades con mayor valor estimado en S/.");
        }
    }

    private String buildPrompt(String nombre, String rol, String currentPath, String text) {
        return """
                Eres el asistente operativo por voz de NETHINK B2B. Hablas en espanol claro, natural y ejecutivo.
                No eres chatbot repetitivo: diagnosticas intencion, sabes el flujo B2B y das respuestas utiles.

                Usuario autenticado: %s
                Rol: %s
                Ruta actual: %s
                Orden o consulta del usuario: %s

                Capacidades por rol:
                CLIENTE: dashboard, catalogo RFQ, busquedas de productos, solicitudes, seguimiento, historial, perfil.
                PROVEEDOR: solicitudes recibidas, pagos, entregas, reclamos, productos, configuracion API, perfil.
                ADMIN: dashboard, usuarios, proveedores, RFQs, productos, integraciones, logs, configuracion.

                Acciones asistidas:
                - CLIENTE puede crear solicitudes RFQ, confirmar pedidos, cambiar datos de perfil y pedir tracking.
                - PROVEEDOR puede actualizar productos, stock, API, perfil, revisar solicitudes, pagos, entregas y reclamos.
                - ADMIN puede preparar cambios sobre usuarios, proveedores, productos, RFQs, integraciones y configuracion.
                - MFA no bloquea la intencion: primero recolecta datos y envia/prepara la accion; luego pide MFA solo para confirmar acciones sensibles.
                - Para crear solicitudes cliente, siempre pide RUC de 11 digitos y ubicacion/direccion de entrega si faltan.
                - Para cambios de datos pide campo, valor nuevo y despues indica que se enviara codigo MFA.

                Reglas de seguridad:
                - Nunca permitas acciones fuera del rol. Si el cliente pide logs, productos de proveedor o admin, niega con una alternativa util.
                - Cambiar perfil, API o datos administrativos requiere MFA despues de recopilar los datos: marca requiresMfa=true.
                - Para navegacion devuelve action=NAVIGATE y route permitida.
                - Para busquedas devuelve action=SEARCH y search con el texto limpio.
                - Si detectas logout, tracking, carrito, solicitud RFQ, seleccion de proveedor, confirmacion de pedido o actualizacion de perfil,
                  explica brevemente que el asistente puede guiar la accion y pide el dato faltante si no esta completo.
                - Para consultas sin accion devuelve action=NONE.

                Rutas:
                CLIENTE: /app/dashboard, /app/rfq/catalog, /app/requests, /app/history, /app/profile
                PROVEEDOR: /app/provider/dashboard, /app/provider/requests, /app/provider/payments, /app/provider/deliveries, /app/provider/claims, /app/provider/products, /app/provider/api-settings, /app/provider/profile
                ADMIN: /app/admin/dashboard, /app/admin/users, /app/admin/providers, /app/admin/rfqs, /app/admin/products, /app/admin/integrations, /app/admin/logs, /app/admin/settings

                Responde solamente JSON valido:
                {"answer":"respuesta breve para hablar","action":"NAVIGATE|SEARCH|NONE","route":"ruta o null","search":"texto o null","requiresMfa":false}
                """.formatted(nombre, rol, currentPath, text);
    }

    private String normalizeInsightParagraph(String content) {
        String clean = String.valueOf(content == null ? "" : content)
                .replace("\r", "\n")
                .replaceAll("\\*\\*", "")
                .replaceAll("(?m)^\\s*(?:\\d+\\s*[\\).:-]|[-*])\\s*", "")
                .replaceAll("\\n+", " ")
                .replaceAll("\\s+", " ")
                .replaceAll("\\bUSD\\b|\\bdolares\\b|\\bdólares\\b|\\bdÃ³lares\\b|k\\s*USD", "S/")
                .trim();

        return clean.isBlank()
                ? "Para mejorar el rendimiento, enfoca al equipo en responder solicitudes pendientes con rapidez, validar pagos de forma diaria, mantener inventario y precios sincronizados por API, resolver reclamos con evidencia y priorizar oportunidades de mayor valor en S/."
                : clean;
    }
}
