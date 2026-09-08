package com.nethink.b2b.dto.response;

public class LoginResponse {

    private String token;
    private String correo;
    private String rol;
    private Integer idUsuario;
    private boolean requiresMfa;
    private String tempToken;
    private String redirectTo;
    private String purpose;
    private boolean emailOnly;

    public LoginResponse(String token, String correo, Integer idUsuario, String rol) {
        this.token = token;
        this.correo = correo;
        this.idUsuario = idUsuario;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public String getCorreo() {
        return correo;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }
    public String getRol() {
        return rol;
    }

    public boolean isRequiresMfa() {
        return requiresMfa;
    }

    public void setRequiresMfa(boolean requiresMfa) {
        this.requiresMfa = requiresMfa;
    }

    public String getTempToken() {
        return tempToken;
    }

    public void setTempToken(String tempToken) {
        this.tempToken = tempToken;
    }

    public String getRedirectTo() {
        return redirectTo;
    }

    public void setRedirectTo(String redirectTo) {
        this.redirectTo = redirectTo;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public boolean isEmailOnly() {
        return emailOnly;
    }

    public void setEmailOnly(boolean emailOnly) {
        this.emailOnly = emailOnly;
    }
}
