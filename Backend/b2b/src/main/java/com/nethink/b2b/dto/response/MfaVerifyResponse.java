package com.nethink.b2b.dto.response;

public class MfaVerifyResponse {

    private String mfaActionToken;
    private LoginResponse login;
    private String redirectTo;
    private String message;

    public String getMfaActionToken() {
        return mfaActionToken;
    }

    public void setMfaActionToken(String mfaActionToken) {
        this.mfaActionToken = mfaActionToken;
    }

    public LoginResponse getLogin() {
        return login;
    }

    public void setLogin(LoginResponse login) {
        this.login = login;
    }

    public String getRedirectTo() {
        return redirectTo;
    }

    public void setRedirectTo(String redirectTo) {
        this.redirectTo = redirectTo;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
