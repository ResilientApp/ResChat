package com.resilientdb.reschat.kvservice;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "resilientdb.kv-service")
public class ResilientDBConfig {
    private String host;

    public String getHost() {
        return host;
    }
    public void setHost(String host) {
        this.host = host;
    }
}
