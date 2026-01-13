package edu.frau.service.Service.Management.service;

public interface PmWhitelistService {
    boolean isValidProjectManager(String email, String firstName, String lastName);

    int importFromXml(String xml);
}
