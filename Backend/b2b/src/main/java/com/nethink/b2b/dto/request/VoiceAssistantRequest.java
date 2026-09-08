package com.nethink.b2b.dto.request;

public class VoiceAssistantRequest {

    private String text;
    private String currentPath;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getCurrentPath() {
        return currentPath;
    }

    public void setCurrentPath(String currentPath) {
        this.currentPath = currentPath;
    }
}
