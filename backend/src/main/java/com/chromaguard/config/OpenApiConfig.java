package com.chromaguard.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3 / Swagger configuration for ChromaGuard backend REST API.
 * Defines project metadata, academic evaluation context, and server targets.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI chromaGuardOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ChromaGuard — H2S Exposure Analytics & Safety Intelligence Platform")
                        .version("1.0.0")
                        .description("""
                                **Academic Demonstration & Data Exploration API**
                                
                                ChromaGuard demonstrates personal exposure monitoring, mathematical dose accumulation,
                                statistical moments (Tukey's IQR fences, Pearson correlation), and simulated alert workflows.
                                
                                *SAFETY NOTICE: All measurements, thresholds, and colorimetric badge readings are synthetic
                                educational fixtures and must not be used for life-safety or official OSHA compliance.*
                                """)
                        .contact(new Contact()
                                .name("ChromaGuard Academic Project Team")
                                .email("contact@chromaguard.internal"))
                        .license(new License()
                                .name("MIT Academic License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development & Evaluation Server")
                ));
    }
}
