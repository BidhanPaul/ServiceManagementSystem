package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.service.PmWhitelistService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pm-whitelist")
@CrossOrigin(origins = "*")
public class PmWhitelistController {

    private final PmWhitelistService service;

    public PmWhitelistController(PmWhitelistService service) {
        this.service = service;
    }

    // ✅ Use this from registration flow (validate PM email)
    // Example:
    // GET /api/pm-whitelist/validate?email=john.doe@workforce.com
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validatePm(
            @RequestParam String email,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName
    ) {
        boolean ok = service.isValidProjectManager(email, firstName, lastName);
        return ResponseEntity.ok(ok);
    }

    // ✅ Optional: allow ADMIN to import XML manually (if your service supports it)
    // POST /api/pm-whitelist/import (Content-Type: text/plain) body=<xml>
    @PostMapping(value = "/import", consumes = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<Integer> importXml(@RequestBody String xml) {
        int count = service.importFromXml(xml); // must return int
        return ResponseEntity.ok(count);
    }
}
