package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Project;
import java.util.List;
import java.util.Optional;

public interface ProjectService {
    Project createProject(Project project);
    Optional<Project> getProjectById(Long id);
    List<Project> getAllProjects();
    Optional<Project> updateProject(Long id, Project project);
    boolean deleteProject(Long id);
}
