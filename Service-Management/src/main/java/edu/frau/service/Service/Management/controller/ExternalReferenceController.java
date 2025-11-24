package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.service.ExternalReferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external")
@CrossOrigin(origins = "*")
public class ExternalReferenceController {

    @Autowired
    private ExternalReferenceService externalReferenceService;

    @GetMapping("/projects")
    public List<Map<String, Object>> getProjects() {
        return externalReferenceService.getAllProjects();
    }

    @GetMapping("/contracts")
    public List<Map<String, Object>> getContracts() {
        return externalReferenceService.getAllContracts();
    }
}
