package edu.frau.service.Service.Management.controller;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ApiIndexController {

    private final RequestMappingHandlerMapping handlerMapping;

    public ApiIndexController(
            @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping
    ) {
        this.handlerMapping = handlerMapping;
    }

    @GetMapping("/api-index")
    public List<Map<String, Object>> getAllApis() {
        return handlerMapping.getHandlerMethods().entrySet().stream()
                .map(entry -> {
                    RequestMappingInfo info = entry.getKey();

                    Set<String> paths = new LinkedHashSet<>();
                    if (info.getPathPatternsCondition() != null) {
                        paths.addAll(info.getPathPatternsCondition().getPatternValues());
                    } else if (info.getPatternsCondition() != null) {
                        paths.addAll(info.getPatternsCondition().getPatterns());
                    }

                    Set<String> methods = info.getMethodsCondition().getMethods()
                            .stream()
                            .map(Enum::name)
                            .collect(Collectors.toCollection(LinkedHashSet::new));

                    if (methods.isEmpty()) methods.add("ANY");

                    Map<String, Object> api = new LinkedHashMap<>();
                    api.put("paths", paths);
                    api.put("methods", methods);
                    api.put("controller", entry.getValue().getBeanType().getSimpleName());
                    api.put("handler", entry.getValue().getMethod().getName());
                    return api;
                })
                .filter(api -> !api.get("paths").toString().contains("/error"))
                .sorted(Comparator.comparing(api -> api.get("paths").toString()))
                .collect(Collectors.toList());
    }
}