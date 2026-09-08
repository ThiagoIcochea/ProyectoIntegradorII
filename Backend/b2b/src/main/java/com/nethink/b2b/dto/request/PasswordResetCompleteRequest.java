package com.nethink.b2b.dto.request;

public class PasswordResetCompleteRequest {

    private String email;
    private String mfaActionToken;
    private String newPassword;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMfaActionToken() {
        return mfaActionToken;
    }

    public void setMfaActionToken(String mfaActionToken) {
        this.mfaActionToken = mfaActionToken;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
