package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Project;
import edu.frau.service.Service.Management.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Override
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    @Override
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    @Override
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Override
    public Optional<Project> updateProject(Long id, Project updatedProject) {
        return projectRepository.findById(id).map(existing -> {
            existing.setTitle(updatedProject.getTitle());
            existing.setDescription(updatedProject.getDescription());
            existing.setStartDate(updatedProject.getStartDate());
            existing.setEndDate(updatedProject.getEndDate());
            existing.setRequiredRoles(updatedProject.getRequiredRoles());
            existing.setRequiredSkills(updatedProject.getRequiredSkills());
            existing.setCapacity(updatedProject.getCapacity());
            existing.setLocation(updatedProject.getLocation());
            existing.setLinks(updatedProject.getLinks());
            return projectRepository.save(existing);
        });
    }

    @Override
    public boolean deleteProject(Long id) {
        return projectRepository.findById(id).map(p -> {
            projectRepository.delete(p);
            return true;
        }).orElse(false);
    }
}
