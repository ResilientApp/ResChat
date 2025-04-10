package com.resilientdb.reschat.ipfs;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ipfs.cluster")
public class IpfsClusterConfig {
    private String host;
    private int clusterPort;
    private int gatewayPort;
    private String protocol;

    public String getHost() {
        return host;
    }
    public void setHost(String host) {
        this.host = host;
    }
    public int getClusterPort() {
        return clusterPort;
    }
    public void setClusterPort(int clusterPort) {
        this.clusterPort = clusterPort;
    }
    public int getGatewayPort() {
        return gatewayPort;
    }
    public void setGatewayPort(int gatewayPort) {
        this.gatewayPort = gatewayPort;
    }
    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getProtocol() {
        return protocol;
    }
}
