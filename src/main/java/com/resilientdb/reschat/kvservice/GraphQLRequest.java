package com.resilientdb.reschat.kvservice;

import java.util.Map;

public class GraphQLRequest {
    private String query;
    private Map<String, Object> variables;

    public GraphQLRequest(String query, Map<String, Object> variables) {
        this.query = query;
        this.variables = variables;
    }
}
