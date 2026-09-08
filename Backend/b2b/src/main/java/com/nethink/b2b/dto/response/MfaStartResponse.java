package com.nethink.b2b.dto.response;

public class MfaStartResponse {

    private boolean requiresMfa;
    private String email;
    private String tempToken;
    private String purpose;
    private String redirectTo;
    private boolean emailOnly;
    private String message;
    private int expiresInSeconds;
    private int resendInSeconds;

    public MfaStartResponse() {
    }

    public MfaStartResponse(String email, String tempToken, String purpose, String redirectTo, boolean emailOnly) {
        this.requiresMfa = true;
        this.email = email;
        this.tempToken = tempToken;
        this.purpose = purpose;
        this.redirectTo = redirectTo;
        this.emailOnly = emailOnly;
        this.message = "Codigo MFA enviado";
        this.expiresInSeconds = 300;
        this.resendInSeconds = 30;
    }

    public boolean isRequiresMfa() {
        return requiresMfa;
    }

    public void setRequiresMfa(boolean requiresMfa) {
        this.requiresMfa = requiresMfa;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTempToken() {
        return tempToken;
    }

    public void setTempToken(String tempToken) {
        this.tempToken = tempToken;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getRedirectTo() {
        return redirectTo;
    }

    public void setRedirectTo(String redirectTo) {
        this.redirectTo = redirectTo;
    }

    public boolean isEmailOnly() {
        return emailOnly;
    }

    public void setEmailOnly(boolean emailOnly) {
        this.emailOnly = emailOnly;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public int getResendInSeconds() {
        return resendInSeconds;
    }

    public void setResendInSeconds(int resendInSeconds) {
        this.resendInSeconds = resendInSeconds;
    }
}
