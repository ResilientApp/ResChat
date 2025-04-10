import com.resilientdb.reschat.kvservice.GraphQLRequest;
import com.resilientdb.reschat.kvservice.ResilientDBConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.util.Map;

public class GraphQLClient {
    @Autowired
    private ResilientDBConfig resilientdbConfig;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://cloud.resilientdb.com/graphql")
            .defaultHeader("Content-Type", "application/json")
            .build();

    public String executeGraphQLQuery(String query, Map<String, Object> variables) {
        GraphQLRequest request = new GraphQLRequest(query, variables);

        return webClient.post()
                .uri(resilientdbConfig.getHost())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .block(); // 或者返回 Mono<> 以异步方式处理
    }
}
