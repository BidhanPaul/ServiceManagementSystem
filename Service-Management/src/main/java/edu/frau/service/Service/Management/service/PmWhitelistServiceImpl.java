package edu.frau.service.Service.Management.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Service
public class PmWhitelistServiceImpl implements PmWhitelistService {

    private static final String EMPLOYEE_URL =
            "https://workforcemangementtool.onrender.com/api/employees";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean isValidProjectManager(String email, String firstName, String lastName) {
        if (email == null || email.isBlank()) return false;
        String normEmail = email.trim().toLowerCase();

        try {
            String body = restTemplate.getForObject(EMPLOYEE_URL, String.class);
            if (body == null || body.isBlank()) return false;

            String trimmed = body.trim();

            // ✅ If response looks like XML
            if (trimmed.startsWith("<")) {
                return checkXml(trimmed, normEmail, firstName, lastName);
            }

            // ✅ If response looks like JSON (fallback)
            if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                return checkJson(trimmed, normEmail, firstName, lastName);
            }

            // unknown format
            return false;

        } catch (Exception e) {
            // External service down or format mismatch -> secure default: block PM
            return false;
        }
    }

    private boolean checkXml(String xml, String normEmail, String firstName, String lastName) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(false);
            Document doc = dbf.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            doc.getDocumentElement().normalize();

            NodeList items = doc.getElementsByTagName("item");

            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);

                String role = getText(item, "role");
                String empEmail = getText(item, "email");
                if (empEmail == null) continue;

                boolean emailMatch = normEmail.equals(empEmail.trim().toLowerCase());
                boolean roleMatch = "PROJECT_MANAGER".equalsIgnoreCase(role);

                if (!emailMatch || !roleMatch) continue;

                // Optional name check if provided (you said email alone is enough, so we pass nulls)
                if ((firstName != null && !firstName.isBlank()) ||
                        (lastName != null && !lastName.isBlank())) {

                    String empFirst = getText(item, "firstName");
                    String empLast = getText(item, "lastName");

                    boolean firstOk = (firstName == null || firstName.isBlank())
                            || firstName.trim().equalsIgnoreCase(empFirst);

                    boolean lastOk = (lastName == null || lastName.isBlank())
                            || lastName.trim().equalsIgnoreCase(empLast);

                    return firstOk && lastOk;
                }

                return true;
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    private boolean checkJson(String json, String normEmail, String firstName, String lastName) {
        try {
            JsonNode root = objectMapper.readTree(json);

            // sometimes it could be { "data": [...] } or just [...]
            JsonNode arr = root.isArray() ? root : root.get("data");
            if (arr == null || !arr.isArray()) return false;

            for (JsonNode item : arr) {
                String role = safeText(item.get("role"));
                String empEmail = safeText(item.get("email"));

                if (empEmail == null) continue;

                boolean emailMatch = normEmail.equals(empEmail.trim().toLowerCase());
                boolean roleMatch = "PROJECT_MANAGER".equalsIgnoreCase(role);

                if (!emailMatch || !roleMatch) continue;

                // optional name check if provided
                if ((firstName != null && !firstName.isBlank()) ||
                        (lastName != null && !lastName.isBlank())) {

                    String empFirst = safeText(item.get("firstName"));
                    String empLast = safeText(item.get("lastName"));

                    boolean firstOk = (firstName == null || firstName.isBlank())
                            || firstName.trim().equalsIgnoreCase(empFirst);

                    boolean lastOk = (lastName == null || lastName.isBlank())
                            || lastName.trim().equalsIgnoreCase(empLast);

                    return firstOk && lastOk;
                }

                return true;
            }

            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    public int importFromXml(String xml) {
        if (xml == null || xml.isBlank()) return 0;

        try {
            String trimmed = xml.trim();

            // count PMs for XML input
            if (trimmed.startsWith("<")) {
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                dbf.setNamespaceAware(false);
                Document doc = dbf.newDocumentBuilder()
                        .parse(new ByteArrayInputStream(trimmed.getBytes(StandardCharsets.UTF_8)));
                doc.getDocumentElement().normalize();

                NodeList items = doc.getElementsByTagName("item");
                int count = 0;

                for (int i = 0; i < items.getLength(); i++) {
                    Element item = (Element) items.item(i);
                    String role = getText(item, "role");
                    if ("PROJECT_MANAGER".equalsIgnoreCase(role)) count++;
                }
                return count;
            }

            // count PMs for JSON input too (bonus)
            if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                JsonNode root = objectMapper.readTree(trimmed);
                JsonNode arr = root.isArray() ? root : root.get("data");
                if (arr == null || !arr.isArray()) return 0;

                int count = 0;
                for (JsonNode item : arr) {
                    String role = safeText(item.get("role"));
                    if ("PROJECT_MANAGER".equalsIgnoreCase(role)) count++;
                }
                return count;
            }

            return 0;

        } catch (Exception e) {
            return 0;
        }
    }

    private String getText(Element parent, String tag) {
        NodeList list = parent.getElementsByTagName(tag);
        if (list.getLength() == 0) return null;
        Node n = list.item(0);
        return n == null ? null : n.getTextContent();
    }

    private String safeText(JsonNode n) {
        if (n == null || n.isNull()) return null;
        String v = n.asText();
        return (v == null || v.isBlank()) ? null : v;
    }
}
