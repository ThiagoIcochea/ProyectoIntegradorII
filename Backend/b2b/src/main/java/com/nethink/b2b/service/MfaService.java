package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.MfaStartResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.UsuarioRepository;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class MfaService {

    public static final String PURPOSE_LOGIN = "LOGIN";
    public static final String PURPOSE_REGISTER_CLIENT = "REGISTER_CLIENT";
    public static final String PURPOSE_REGISTER_PROVIDER = "REGISTER_PROVIDER";
    public static final String PURPOSE_PROFILE_UPDATE = "PROFILE_UPDATE";
    public static final String PURPOSE_PROVIDER_API_UPDATE = "PROVIDER_API_UPDATE";
    public static final String PURPOSE_ADMIN_ACTION = "ADMIN_ACTION";
    public static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    private static final int CODE_TTL_MINUTES = 5;
    private static final int ACTION_TOKEN_TTL_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();
    private final Map<String, ActionToken> actionTokens = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    public MfaService(EmailService emailService, UsuarioRepository usuarioRepository) {
        this.emailService = emailService;
        this.usuarioRepository = usuarioRepository;
    }

    public MfaStartResponse start(String email, String purpose, String method, String redirectTo, boolean emailOnly, Object payload) {
        String cleanEmail = normalize(email);
        String cleanPurpose = normalizePurpose(purpose);
        String selectedMethod = emailOnly ? "email" : normalizeMethod(method);
        String tempToken = UUID.randomUUID().toString();
        String code = String.format("%06d", random.nextInt(1_000_000));

        Challenge challenge = new Challenge();
        challenge.email = cleanEmail;
        challenge.purpose = cleanPurpose;
        challenge.method = selectedMethod;
        challenge.code = code;
        challenge.expiresAt = LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES);
        challenge.payload = payload;
        challenge.redirectTo = redirectTo;
        challenge.emailOnly = emailOnly;
        challenges.put(tempToken, challenge);

        sendCode(cleanEmail, code, selectedMethod, cleanPurpose);
        return buildResponse(cleanEmail, tempToken, cleanPurpose, redirectTo, emailOnly, challenge);
    }

    public MfaStartResponse resend(String email, String tempToken, String method) {
        Challenge challenge = getChallenge(tempToken, email, null);
        challenge.method = challenge.emailOnly ? "email" : normalizeMethod(method);
        challenge.code = String.format("%06d", random.nextInt(1_000_000));
        challenge.expiresAt = LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES);
        challenge.attempts = 0;
        sendCode(challenge.email, challenge.code, challenge.method, challenge.purpose);
        return buildResponse(challenge.email, tempToken, challenge.purpose, challenge.redirectTo, challenge.emailOnly, challenge);
    }

    public Challenge verifyChallenge(String email, String tempToken, String code, String purpose) {
        Challenge challenge = getChallenge(tempToken, email, purpose);

        if (LocalDateTime.now().isAfter(challenge.expiresAt)) {
            challenges.remove(tempToken);
            throw new RuntimeException("El codigo MFA expiro. Solicita uno nuevo.");
        }

        if (!challenge.code.equals(String.valueOf(code == null ? "" : code).trim())) {
            challenge.attempts++;
            if (challenge.attempts >= MAX_ATTEMPTS) {
                challenges.remove(tempToken);
                blockUserIfExists(challenge.email);
                throw new RuntimeException("Cuenta bloqueada por demasiados intentos MFA fallidos.");
            }
            throw new RuntimeException("Codigo MFA incorrecto. Intentos restantes: " + (MAX_ATTEMPTS - challenge.attempts));
        }

        challenges.remove(tempToken);
        return challenge;
    }

    public String issueActionToken(String email, String purpose) {
        String token = UUID.randomUUID().toString();
        ActionToken actionToken = new ActionToken();
        actionToken.email = normalize(email);
        actionToken.purpose = normalizePurpose(purpose);
        actionToken.expiresAt = LocalDateTime.now().plusMinutes(ACTION_TOKEN_TTL_MINUTES);
        actionTokens.put(token, actionToken);
        return token;
    }

    public void consumeActionToken(String token, String email, String purpose) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Verificacion multifactor requerida.");
        }

        ActionToken actionToken = actionTokens.remove(token);
        if (actionToken == null) {
            throw new RuntimeException("Verificacion multifactor invalida o ya utilizada.");
        }

        if (!actionToken.email.equals(normalize(email)) || !actionToken.purpose.equals(normalizePurpose(purpose))) {
            throw new RuntimeException("La verificacion multifactor no corresponde a esta accion.");
        }

        if (LocalDateTime.now().isAfter(actionToken.expiresAt)) {
            throw new RuntimeException("La verificacion multifactor expiro.");
        }
    }

    private Challenge getChallenge(String tempToken, String email, String purpose) {
        Challenge challenge = challenges.get(tempToken);
        if (challenge == null) {
            throw new RuntimeException("Flujo MFA no encontrado o expirado.");
        }

        if (!challenge.email.equals(normalize(email))) {
            throw new RuntimeException("El correo no corresponde al flujo MFA.");
        }

        if (purpose != null && !challenge.purpose.equals(normalizePurpose(purpose))) {
            throw new RuntimeException("El MFA no corresponde a esta accion.");
        }

        return challenge;
    }

    private MfaStartResponse buildResponse(String email, String tempToken, String purpose, String redirectTo, boolean emailOnly, Challenge challenge) {
        MfaStartResponse response = new MfaStartResponse(email, tempToken, purpose, redirectTo, emailOnly);
        if (challenge != null && challenge.expiresAt != null) {
            long seconds = java.time.Duration.between(LocalDateTime.now(), challenge.expiresAt).getSeconds();
            response.setExpiresInSeconds((int) Math.max(0, seconds));
        }
        response.setResendInSeconds(30);
        return response;
    }

    private void blockUserIfExists(String email) {
        usuarioRepository.findByCorreo(email).ifPresent(user -> {
            user.setEstado(EstadoUsuario.BLOQUEADO);
            usuarioRepository.save(user);
        });
    }

    private void sendCode(String email, String code, String method, String purpose) {
        String selectedMethod = normalizeMethod(method);

        if ("email".equals(selectedMethod)) {
            emailService.enviarCodigoMfa(email, code, selectedMethod, purpose, CODE_TTL_MINUTES);
            return;
        }

        Usuario usuario = usuarioRepository.findByCorreo(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado para enviar MFA."));

        String phone = "whatsapp".equals(selectedMethod)
                ? firstNonBlank(usuario.getWhatsapp(), usuario.getTelefono())
                : firstNonBlank(usuario.getTelefono(), usuario.getWhatsapp());

        if (phone == null || phone.isBlank()) {
            throw new RuntimeException("No hay telefono registrado para enviar MFA por " + selectedMethod + ".");
        }

        String macroMethod = switch (selectedMethod) {
            case "whatsapp" -> "wtsp";
            case "call" -> "call";
            case "sms" -> "sms";
            default -> "email";
        };

        String name = firstNonBlank(
                (usuario.getNombres() + " " + usuario.getApellidos()).trim(),
                usuario.getCorreo()
        );

        String url = "https://trigger.macrodroid.com/543902b9-9627-4797-833f-8ab08ee4a3ec/otp"
                + "?nombre=" + encode(name)
                + "&numero=" + encode(phone)
                + "&metodo=" + encode(macroMethod)
                + "&codigo=" + encode(code);

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Trigger MFA respondio con estado " + response.statusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("No se pudo enviar MFA por " + selectedMethod + ".", e);
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String encode(String value) {
        return URLEncoder.encode(String.valueOf(value == null ? "" : value), StandardCharsets.UTF_8);
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value).trim().toLowerCase();
    }

    private String normalizePurpose(String value) {
        return String.valueOf(value == null ? "" : value).trim().toUpperCase();
    }

    private String normalizeMethod(String value) {
        String method = String.valueOf(value == null ? "email" : value).trim().toLowerCase();
        if (method.equals("sms") || method.equals("whatsapp") || method.equals("call") || method.equals("email")) {
            return method;
        }
        return "email";
    }

    public static class Challenge {
        public String email;
        public String purpose;
        public String method;
        public String code;
        public LocalDateTime expiresAt;
        public int attempts;
        public Object payload;
        public String redirectTo;
        public boolean emailOnly;
    }

    private static class ActionToken {
        private String email;
        private String purpose;
        private LocalDateTime expiresAt;
    }
}
