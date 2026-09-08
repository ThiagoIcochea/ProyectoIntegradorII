package com.nethink.b2b.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class AppConfigTest {

    @Test
    void restTemplateUsesARequestFactoryThatSupportsPatch() {
        var restTemplate = new AppConfig().restTemplate();

        assertInstanceOf(JdkClientHttpRequestFactory.class, restTemplate.getRequestFactory());
    }
}
