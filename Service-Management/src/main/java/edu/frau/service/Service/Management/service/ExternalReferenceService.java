package edu.frau.service.Service.Management.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ExternalReferenceService {

    // Group-1: projects (published projects)
    private static final String PROJECT_API =
            "https://workforcemangementtool.onrender.com/api/project-manager/projects/external-search";

    // Group-2: contracts
    // (can stay as-is; code below supports wrapper responses too)
    private static final String CONTRACT_API =
            "https://69233a5309df4a492324c022.mockapi.io/Contracts";

    private final RestTemplate restTemplate = new RestTemplate();

    // ---------------- PROJECTS (RAW) ----------------

    @SuppressWarnings("unchecked")
    public Map<String, Object> getProjectsResponse() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                PROJECT_API,
                HttpMethod.GET,
                entity,
                Object.class
        );

        Object body = response.getBody();
        if (body == null) return Map.of("data", List.of());

        if (body instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        if (body instanceof List<?> list) {
            Map<String, Object> wrapper = new LinkedHashMap<>();
            wrapper.put("message", "ok");
            wrapper.put("data", list);
            return wrapper;
        }

        return Map.of("data", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllProjects() {
        Map<String, Object> body = getProjectsResponse();
        if (body == null) return List.of();

        Object data = body.get("data");
        if (data instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    out.add((Map<String, Object>) m);
                }
            }
            return out;
        }
        return List.of();
    }

    public Map<String, Object> getProject(String projectIdOrId) {
        return getAllProjects().stream()
                .filter(p ->
                        projectIdOrId.equals(String.valueOf(p.get("projectId"))) ||
                                projectIdOrId.equals(String.valueOf(p.get("id"))) ||
                                projectIdOrId.equals(String.valueOf(p.get("_id")))
                )
                .findFirst()
                .orElse(null);
    }

    // ---------------- PROJECTS (NORMALIZED FOR AUTOFILL) ----------------

    public Map<String, Object> getProjectNormalized(String projectIdOrId) {
        Map<String, Object> p = getProject(projectIdOrId);
        if (p == null) return null;

        Map<String, Object> out = new LinkedHashMap<>();

        String projectId = firstNonBlank(
                asString(p.get("projectId")),
                asString(p.get("id")),
                asString(p.get("_id"))
        );

        String projectName = firstNonBlank(
                asString(p.get("projectName")),
                asString(p.get("projectDescription")),
                asString(p.get("name")),
                asString(p.get("title"))
        );

        String title = firstNonBlank(
                asString(p.get("title")),
                asString(p.get("name")),
                asString(p.get("projectDescription")),
                projectName
        );

        // ✅ FIX: your payload uses projectStart/projectEnd
        String startDate = firstNonBlank(
                asString(p.get("startDate")),
                asString(p.get("start_date")),
                asString(p.get("start")),
                asString(p.get("projectStart"))
        );

        String endDate = firstNonBlank(
                asString(p.get("endDate")),
                asString(p.get("end_date")),
                asString(p.get("end")),
                asString(p.get("projectEnd"))
        );

        // ✅ FIX: your payload uses selectedLocations
        List<String> locations = extractLocations(p);

        // ✅ FIX: your payload uses roles[].requiredRole + roles[].requiredCompetencies
        List<Map<String, Object>> roles = extractRoles(p);

        // ✅ FIX: your payload uses selectedSkills
        List<String> skills = extractSkills(p);

        out.put("projectId", projectId);
        out.put("projectName", projectName);
        out.put("title", title);
        out.put("startDate", startDate);
        out.put("endDate", endDate);
        out.put("locations", locations);
        out.put("roles", roles);
        out.put("skills", skills);

        out.put("raw", p);
        return out;
    }

    public List<Map<String, Object>> getProjectRoles(String projectIdOrId) {
        Map<String, Object> norm = getProjectNormalized(projectIdOrId);
        if (norm == null) return List.of();
        Object roles = norm.get("roles");
        if (roles instanceof List<?> list) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> cast = (List<Map<String, Object>>) roles;
            return cast;
        }
        return List.of();
    }

    public List<String> getProjectLocations(String projectIdOrId) {
        Map<String, Object> norm = getProjectNormalized(projectIdOrId);
        if (norm == null) return List.of();
        Object loc = norm.get("locations");
        if (loc instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object o : list) out.add(String.valueOf(o));
            return out;
        }
        return List.of();
    }

    // ---------------- CONTRACTS (Group-2) ----------------
    // ✅ wrapper-safe + normalized fields for frontend

    @SuppressWarnings("unchecked")
    public Map<String, Object> getContractsResponse() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                CONTRACT_API,
                HttpMethod.GET,
                entity,
                Object.class
        );

        Object body = response.getBody();
        if (body == null) return Map.of("data", List.of());

        // case 1: wrapper map: { success, data: [...] }
        if (body instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        // case 2: raw list
        if (body instanceof List<?> list) {
            Map<String, Object> wrapper = new LinkedHashMap<>();
            wrapper.put("success", true);
            wrapper.put("data", list);
            return wrapper;
        }

        return Map.of("data", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllContracts() {
        Map<String, Object> body = getContractsResponse();
        if (body == null) return List.of();

        Object data = body.get("data");
        if (!(data instanceof List<?> list)) return List.of();

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : list) {
            if (o instanceof Map<?, ?> m) {
                Map<String, Object> raw = (Map<String, Object>) m;
                out.add(normalizeContract(raw));
            }
        }
        return out;
    }

    public Map<String, Object> getContract(String contractIdOrRefOrMongoId) {
        // ✅ safest: filter from all (works even if /{id} endpoint doesn’t exist)
        return getAllContracts().stream()
                .filter(c ->
                        contractIdOrRefOrMongoId.equals(String.valueOf(c.get("id"))) ||
                                contractIdOrRefOrMongoId.equals(String.valueOf(c.get("_id"))) ||
                                contractIdOrRefOrMongoId.equals(String.valueOf(c.get("contractId")))
                )
                .findFirst()
                .orElse(null);
    }

    // ✅ Normalization so frontend always has:
    // id, supplier, domain (= contractType), approved
    @SuppressWarnings("unchecked")
    private Map<String, Object> normalizeContract(Map<String, Object> c) {
        Map<String, Object> out = new LinkedHashMap<>(c);

        String id = firstNonBlank(
                asString(c.get("id")),
                asString(c.get("_id")),
                asString(c.get("contractId"))
        );
        out.put("id", id);

        // ✅ Domain = contractType (as you requested)
        String domain = firstNonBlank(
                asString(c.get("domain")),
                asString(c.get("contractType")),
                asString(c.get("type"))
        );
        out.put("domain", domain);

        // ✅ supplier: try usual fields, then try workflow.coordinator.selectedOffer.provider.name
        String supplier = firstNonBlank(
                asString(c.get("supplier")),
                asString(c.get("contractSupplier")),
                asString(c.get("supplierName"))
        );

        if (supplier == null) {
            Object wf = c.get("workflow");
            if (wf instanceof Map<?, ?> wfMap) {
                Object coord = ((Map<String, Object>) wfMap).get("coordinator");
                if (coord instanceof Map<?, ?> coordMap) {
                    Object sel = ((Map<String, Object>) coordMap).get("selectedOffer");
                    if (sel instanceof Map<?, ?> selMap) {
                        Object prov = ((Map<String, Object>) selMap).get("provider");
                        if (prov instanceof Map<?, ?> provMap) {
                            supplier = firstNonBlank(
                                    asString(((Map<String, Object>) provMap).get("name")),
                                    asString(((Map<String, Object>) provMap).get("providerName"))
                            );
                        }
                    }
                }
            }
        }

        out.put("supplier", supplier);

        // ✅ approved: accept boolean OR approvedAt in workflow.finalApproval
        Boolean approved = null;
        Object appr = c.get("approved");
        if (appr instanceof Boolean b) approved = b;

        if (approved == null) {
            Object wf = c.get("workflow");
            if (wf instanceof Map<?, ?> wfMap) {
                Object fa = ((Map<String, Object>) wfMap).get("finalApproval");
                if (fa instanceof Map<?, ?> faMap) {
                    String approvedAt = asString(((Map<String, Object>) faMap).get("approvedAt"));
                    if (approvedAt != null) approved = true;
                }
            }
        }

        out.put("approved", approved);

        return out;
    }

    // ---------------- small safe helpers ----------------

    private String asString(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o);
        return s.isBlank() ? null : s;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private Object firstNonNull(Object... values) {
        if (values == null) return null;
        for (Object v : values) {
            if (v != null) return v;
        }
        return null;
    }

    private Integer toIntSafe(Object o) {
        if (o == null) return null;
        try {
            String s = String.valueOf(o).trim();
            if (s.isBlank()) return null;
            return Integer.parseInt(s);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> extractLocations(Map<String, Object> p) {
        // ✅ FIX: support selectedLocations (your payload)
        Object locationsObj = firstNonNull(
                p.get("locations"),
                p.get("selectedLocations"),
                p.get("performanceLocations"),
                p.get("performanceLocationOptions")
        );

        if (locationsObj instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object o : list) {
                if (o == null) continue;
                String s = String.valueOf(o).trim();
                if (!s.isBlank()) out.add(s);
            }
            if (!out.isEmpty()) return out;
        }

        String single = firstNonBlank(
                asString(p.get("location")),
                asString(p.get("performanceLocation"))
        );

        if (single != null) return List.of(single);
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractRoles(Map<String, Object> p) {
        Object rolesObj = firstNonNull(
                p.get("roles"),
                p.get("requestedRoles"),
                p.get("projectRoles"),
                p.get("staffing")
        );

        // ✅ helper to normalize each role object into what frontend expects
        // frontend expects: roleName + competencies + manDays (optional) etc.
        java.util.function.Function<Map<String, Object>, Map<String, Object>> normalizeRole = (rawRole) -> {
            Map<String, Object> out = new LinkedHashMap<>(rawRole);

            // ✅ key mapping for your payload
            String roleName = firstNonBlank(
                    asString(rawRole.get("roleName")),
                    asString(rawRole.get("requiredRole")),
                    asString(rawRole.get("name")),
                    asString(rawRole.get("role"))
            );
            out.put("roleName", roleName);

            Object compsObj = firstNonNull(
                    rawRole.get("competencies"),
                    rawRole.get("requiredCompetencies"),
                    rawRole.get("skills"),
                    rawRole.get("technology")
            );

            List<String> competencies = new ArrayList<>();
            if (compsObj instanceof List<?> clist) {
                for (Object c : clist) {
                    if (c == null) continue;
                    String s = String.valueOf(c).trim();
                    if (!s.isBlank()) competencies.add(s);
                }
            } else if (compsObj != null) {
                String s = String.valueOf(compsObj).trim();
                if (!s.isBlank()) competencies.add(s);
            }
            out.put("competencies", competencies);

            // ✅ map capacity -> manDays (best-fit for your schema)
            Integer manDays = toIntSafe(firstNonNull(rawRole.get("manDays"), rawRole.get("capacity")));
            if (manDays != null) out.put("manDays", manDays);

            // ✅ numberOfEmployees -> headcount (optional but useful)
            Integer headcount = toIntSafe(firstNonNull(rawRole.get("headcount"), rawRole.get("numberOfEmployees")));
            if (headcount != null) out.put("headcount", headcount);

            return out;
        };

        if (rolesObj instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    out.add(normalizeRole.apply((Map<String, Object>) m));
                } else if (o != null) {
                    Map<String, Object> roleMap = new LinkedHashMap<>();
                    roleMap.put("roleName", String.valueOf(o));
                    roleMap.put("competencies", List.of());
                    out.add(roleMap);
                }
            }
            return out;
        }

        if (rolesObj instanceof Map<?, ?> map) {
            List<Map<String, Object>> out = new ArrayList<>();
            out.add(normalizeRole.apply((Map<String, Object>) map));
            return out;
        }

        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractSkills(Map<String, Object> p) {
        // ✅ FIX: support selectedSkills (your payload)
        Object skillsObj = firstNonNull(
                p.get("skills"),
                p.get("selectedSkills"),
                p.get("selectedSkillsList"),
                p.get("selectedSkillsOptions"),
                p.get("competencies")
        );

        if (skillsObj instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object o : list) {
                if (o == null) continue;
                String s = String.valueOf(o).trim();
                if (!s.isBlank()) out.add(s);
            }
            return out;
        }
        return List.of();
    }
}
