package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.service.ExternalReferenceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external")
@CrossOrigin(origins = "*")
public class ExternalReferenceController {

    private final ExternalReferenceService externalReferenceService;

    public ExternalReferenceController(ExternalReferenceService externalReferenceService) {
        this.externalReferenceService = externalReferenceService;
    }

    // ---- Projects (RAW) ----
    @GetMapping("/projects")
    public List<Map<String, Object>> getAllProjects() {
        return externalReferenceService.getAllProjects();
    }

    @GetMapping("/projects/{id}")
    public Map<String, Object> getProject(@PathVariable String id) {
        return externalReferenceService.getProject(id);
    }

    // ---- Projects (Normalized for autofill) ----
    @GetMapping("/projects/{id}/normalized")
    public Map<String, Object> getProjectNormalized(@PathVariable String id) {
        return externalReferenceService.getProjectNormalized(id);
    }

    @GetMapping("/projects/{id}/roles")
    public List<Map<String, Object>> getProjectRoles(@PathVariable String id) {
        return externalReferenceService.getProjectRoles(id);
    }

    @GetMapping("/projects/{id}/locations")
    public List<String> getProjectLocations(@PathVariable String id) {
        return externalReferenceService.getProjectLocations(id);
    }

    // ---- Contracts (Group-2) ----
    @GetMapping("/contracts")
    public List<Map<String, Object>> getAllContracts() {
        return externalReferenceService.getAllContracts();
    }

    @GetMapping("/contracts/{id}")
    public Map<String, Object> getContract(@PathVariable String id) {
        return externalReferenceService.getContract(id);
    }
}
