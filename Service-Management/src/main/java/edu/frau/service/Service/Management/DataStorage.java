package edu.frau.service.Service.Management;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.model.User;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class DataStorage {

    public static final Map<String, User> USERS = new ConcurrentHashMap<>();
    public static final Map<Long, ServiceRequest> REQUESTS = new ConcurrentHashMap<>();
    public static final Map<Long, Notification> NOTIFICATIONS = new ConcurrentHashMap<>();

    public static final AtomicLong USER_ID_SEQ = new AtomicLong(1);
    public static final AtomicLong REQUEST_ID_SEQ = new AtomicLong(1);
    public static final AtomicLong NOTIF_ID_SEQ = new AtomicLong(1);

    // helper to find users by role
    public static List<User> findUsersByRoleName(String roleName) {
        List<User> out = new ArrayList<>();
        for (User u : USERS.values()) {
            if (u.getRole() != null && u.getRole().name().equals(roleName)) {
                out.add(u);
            }

        }
        return out;
    }

}
