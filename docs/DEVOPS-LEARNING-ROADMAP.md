# DevOps learning roadmap

This repository is deliberately kept as a modular monolith while its delivery
platform is developed. A production-style platform does not require every
domain to become a microservice. The goal is to learn the complete lifecycle:
build, test, secure, release, deploy, observe, recover, and document.

## Current platform foundation

- GitHub Actions runs backend tests, frontend tests/build, and container validation.
- Release is an explicit workflow and uses immutable version/SHA image tags.
- GCP authentication is designed for GitHub OIDC/Workload Identity Federation,
  not a long-lived service-account JSON key.
- Helm packages the backend with probes, resource limits, security context,
  optional autoscaling, and a PodDisruptionBudget.
- The container runs as a non-root user.

The release workflow requires these GitHub repository/environment variables:

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`

Configure these only after creating the GCP workload identity pool and a
least-privilege deployer service account. Do not add credentials to Git.

## Learning sequence

### 1. Application readiness

Add service and controller tests, PostgreSQL integration tests with Testcontainers,
API contract tests, webhook idempotency, timeout/retry behavior for external
systems, and database migrations with Flyway or Liquibase. Replace
`spring.jpa.hibernate.ddl-auto=update` before using a shared environment.

### 2. Local development

Create a local Compose profile for the backend, frontend, and PostgreSQL.
Use `.env.example` for names only; keep actual values local. Add a documented
smoke test that exercises login, request creation, offer submission, and order
approval.

### 3. Infrastructure as code

Add Terraform modules for GCP projects or enabled APIs, VPC, GKE, Artifact
Registry, Cloud SQL, Secret Manager, service accounts, Workload Identity,
monitoring, and backups. Use a remote GCS state bucket and separate dev,
staging, and production state. Run `terraform fmt`, `validate`, `plan`, and
policy checks in pull requests; apply only from an approved environment.

### 4. Kubernetes and GitOps

Install Argo CD in a disposable dev cluster. Keep application source and
environment declarations separate. CI builds one signed image and updates the
GitOps repository; Argo CD synchronizes the selected image into dev, staging,
and production. Promote the same image instead of rebuilding per environment.

### 5. Release engineering

Use short-lived branches and pull requests, protected `main`, semantic version
tags, release notes, migration notes, and rollback runbooks. Require approval
for production. Practice rolling deployments, rollback, failed migration
recovery, and restoring a database backup.

### 6. Security and observability

Add CodeQL, dependency review, secret scanning, Trivy image scanning, SBOM
generation, image signing, Kubernetes policy checks, and least-privilege IAM.
Add structured logs, correlation IDs, metrics, traces, dashboards, and alerts
for latency, errors, restarts, failed rollouts, database saturation, and
external integration failures.

## Environment promotion

```text
pull request
  -> CI and review
  -> merge to main
  -> immutable image published
  -> dev deployment
  -> smoke and integration tests
  -> staging/simulation approval
  -> production approval
  -> Argo CD sync and rollout verification
```

Pull requests must never modify a shared cluster. Production credentials must
be available only to the protected release environment.
