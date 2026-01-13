package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.service.ExternalReferenceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external") // ✅ IMPORTANT
@CrossOrigin(origins = "*") // ok for dev
public class ExternalReferenceController {

    private final ExternalReferenceService externalReferenceService;

    public ExternalReferenceController(ExternalReferenceService externalReferenceService) {
        this.externalReferenceService = externalReferenceService;
    }

    // ---- Projects ----
    @GetMapping("/projects")
    public List<Map<String, Object>> getAllProjects() {
        return externalReferenceService.getAllProjects();
    }

    @GetMapping("/projects/{id}")
    public Map<String, Object> getProject(@PathVariable String id) {
        return externalReferenceService.getProject(id);
    }

    // ---- Contracts ----
    @GetMapping("/contracts")
    public List<Map<String, Object>> getAllContracts() {
        return externalReferenceService.getAllContracts();
    }

    @GetMapping("/contracts/{id}")
    public Map<String, Object> getContract(@PathVariable String id) {
        return externalReferenceService.getContract(id);
    }
}
