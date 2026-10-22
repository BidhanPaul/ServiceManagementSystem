# Service Management System

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-production-4169E1?logo=postgresql&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-GKE-326CE5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

An end-to-end service procurement platform for managing service requests,
provider bidding, offer evaluation, service orders, approvals, notifications,
and external provider integrations.

This repository is also a practical DevOps learning platform. It intentionally
keeps the business application as a modular monolith while adding the
production practices around it: testing, containerization, GitHub Actions,
Google Cloud, Kubernetes, Helm, GitOps, security, observability, releases, and
recovery. The application does not need to become a collection of microservices
to demonstrate professional DevOps.

## Table of contents

- [Project overview](#project-overview)
- [System architecture](#system-architecture)
- [Repository layout](#repository-layout)
- [Application functionality](#application-functionality)
- [Backend](#backend)
- [Frontend](#frontend)
- [Infrastructure and DevOps](#infrastructure-and-devops)
- [Development workflow](#development-workflow)
- [Git and branching strategy](#git-and-branching-strategy)
- [CI/CD and release strategy](#cicd-and-release-strategy)
- [Environments](#environments)
- [Security](#security)
- [Testing strategy](#testing-strategy)
- [Local setup](#local-setup)
- [Operational checklist](#operational-checklist)
- [Learning roadmap](#learning-roadmap)
- [Related project](#related-project)
- [License](#license)

## Project overview

The system supports this business process:

```text
Project Manager
      |
      | creates service request
      v
Procurement Officer
      |
      | approves request for bidding
      v
Service Providers
      |
      | submit offers
      v
Resource Planner
      |
      | evaluates offers and creates order
      v
Order approval, delivery, changes, feedback, and completion
```

The backend is one independently deployable Spring Boot application. The
frontend is a separate React application. External provider and contract
systems are integrated through isolated adapters in the backend. This is a
modular-monolith architecture: simpler to operate than premature
microservices, while still providing clear domain boundaries.

## System architecture

```text
                         +----------------------+
                         | React frontend       |
                         | local:3000           |
                         +----------+-----------+
                                    |
                                    | REST/JSON + JWT
                                    v
                         +----------------------+
                         | Spring Boot backend  |
                         | port 8080            |
                         |                      |
                         | auth/security        |
                         | requests and offers  |
                         | orders and contracts |
                         | notifications        |
                         | integrations         |
                         +----+------------+----+
                              |            |
                         JPA/Postgres   external APIs
                              |
                         +----v-----+
                         | Database |
                         +----------+

  GitHub Actions -> Artifact Registry -> Helm/GKE
  GitHub/GitOps   -> Argo CD (planned next platform stage)
```

### Architectural decision

The current design uses one backend image, not one image per feature. A domain
should become a separate service only when it needs independent ownership,
scaling, deployment frequency, reliability, or data isolation. Authentication
may later move to an identity provider such as Keycloak, Auth0, or Google
Cloud Identity, but the backend must still enforce authorization.

## Repository layout

```text
.
├── Service-Management/              # Spring Boot backend
│   ├── src/main/java/.../
│   │   ├── controller/              # REST API endpoints
│   │   ├── service/                 # Business logic
│   │   ├── repository/              # Spring Data repositories
│   │   ├── model/                   # JPA entities and enums
│   │   ├── dto/                     # API request/response objects
│   │   ├── security/                # JWT, API key, access rules
│   │   ├── integration/              # External HTTP clients
│   │   └── exception/               # Error handling
│   ├── src/test/                    # Backend tests
│   ├── Dockerfile                   # Non-root production image
│   └── pom.xml                      # Maven dependencies/build
├── frontend/                        # React frontend
│   ├── src/                         # Pages, components, API client
│   ├── package.json                 # Node scripts/dependencies
│   └── package-lock.json            # Reproducible npm dependency tree
├── helm/service-management/         # Helm chart for the backend
├── k8s/                             # Original/raw Kubernetes manifests
├── .github/
│   ├── workflows/ci.yml             # Pull request and main CI
│   ├── workflows/release.yml        # Manual image release
│   ├── dependabot.yml               # Dependency update automation
│   ├── CODEOWNERS                   # Review ownership
│   └── pull_request_template.md     # Change/release checklist
└── docs/
    └── DEVOPS-LEARNING-ROADMAP.md   # Detailed learning sequence
```

## Application functionality

### Roles

| Role | Main responsibility |
|---|---|
| `ADMIN` | User administration and system oversight |
| `PROJECT_MANAGER` | Create/reactivate requests and submit order feedback |
| `PROCUREMENT_OFFICER` | Approve or reject requests for bidding |
| `RESOURCE_PLANNER` | Evaluate offers and create/approve orders |
| `SERVICE_PROVIDER` | Submit offers on open requests |

Additional roles are reserved for future provider and contract workflows.

### Service request lifecycle

```text
DRAFT -> IN_REVIEW -> APPROVED_FOR_BIDDING -> BIDDING
                                      |             |
                                      |             v
                                      |         EVALUATION
                                      |             |
                                      v             v
                                  REJECTED       ORDERED -> COMPLETED

BIDDING -> EXPIRED when no offer is received before the deadline
```

The scheduled bidding-cycle component expires requests whose bidding window
has ended. Bidding windows can be configured for demonstrations and normal
workflow operation.

### Service order lifecycle

```text
PENDING_RP_APPROVAL -> SUBMITTED_TO_PROVIDER -> APPROVED
                                              |
                                              v
                                           REJECTED
```

Orders support substitution and extension change requests. Notifications and
direct messaging provide workflow communication between users.

## Backend

The backend uses:

- Java 21 and Spring Boot 3.5
- Spring Web and REST/JSON APIs
- Spring Security with JWT authentication
- API-key filters for public bidding and integration callbacks
- Spring Data JPA and PostgreSQL
- H2 for tests/local development
- Spring Scheduling for bidding-cycle automation
- Spring Actuator health endpoints
- Springdoc OpenAPI/Swagger

The backend follows this request path:

```text
Controller -> Service -> Repository -> Database
     |
     +-> DTO validation and global exception handling
     |
     +-> Integration adapter for external systems
```

The backend is intentionally organized by technical layer today. As the
project grows, related classes can be grouped into stronger domain modules
without changing the public API.

## Frontend

The frontend is a React single-page application with:

- Role-aware dashboards
- Login and registration
- Request and offer workflows
- Order details and approvals
- Notifications and messaging
- Administrative user views
- API access through Axios
- React Router
- Tailwind CSS and charting components

The frontend has an independent build and should eventually be deployed as its
own static web artifact or container. It should not be bundled into the
backend container in production because its release lifecycle is different.

## Infrastructure and DevOps

### Current platform foundation

- Docker multi-stage backend image
- Non-root container runtime
- `.dockerignore`
- GitHub Actions CI
- Manual release workflow
- GCP Artifact Registry image publishing
- GKE-compatible deployment
- Helm chart with dev and production values
- Kubernetes readiness and liveness probes
- Resource requests and limits
- Optional HorizontalPodAutoscaler
- PodDisruptionBudget for multi-replica deployments
- Kubernetes security context and read-only root filesystem
- Dependabot, CODEOWNERS, and pull request checklist

### Planned target platform

```text
Terraform
  -> GCP projects, VPC, GKE, Artifact Registry, Cloud SQL,
     Secret Manager, IAM, Workload Identity, monitoring, backups

GitHub Actions
  -> test, scan, build, sign, publish immutable image

GitOps repository
  -> environment-specific Helm values

Argo CD
  -> reconcile dev, staging/simulation, and production clusters/namespaces
```

The target design separates application source from environment state. CI
builds an image; GitOps declares where that exact image should run; Argo CD
performs reconciliation. Production should not be changed by an ad-hoc
`kubectl` command from a pull request.

## Development workflow

Every change should follow this lifecycle:

```text
issue or task
  -> short-lived branch
  -> local development
  -> tests and lint
  -> pull request
  -> review and CI
  -> merge to protected main
  -> dev deployment
  -> staging/simulation verification
  -> approved production release
```

Pull requests should explain:

- What behavior changed
- Which components and environments are affected
- What tests were run
- Whether a database migration is required
- How the change is monitored
- How the change can be rolled back

## Git and branching strategy

The repository uses `main` as the protected integration branch.

### Branch naming

Use short-lived branches with a clear type:

```text
feature/request-approval-rules
fix/provider-timeout
chore/update-spring-boot
docs/release-process
infra/gke-dev-cluster
```

### Commit conventions

Prefer small, focused commits using an understandable prefix:

```text
feat: add order extension workflow
fix: reject duplicate provider callbacks
test: cover request approval service
ci: validate Helm chart in pull requests
infra: add GKE development Terraform
docs: document production rollback
```

Do not commit secrets, generated build output, local environment files,
Terraform state, or production database data.

### Main branch policy

- No direct pushes to `main` for normal work.
- Pull request review is required.
- Required CI checks must pass.
- Squash or rebase according to the repository policy.
- Release commits and tags must identify the version being deployed.
- Use revert or a new corrective commit instead of rewriting shared history.

## CI/CD and release strategy

### Pull request CI

`.github/workflows/ci.yml` currently validates:

1. Backend compilation, tests, and Maven verification
2. Frontend dependency installation, tests, and production build
3. Backend Docker image construction
4. Helm linting and template rendering

Pull requests do not receive cloud deployment credentials and do not deploy to
a shared cluster.

### Image release

`.github/workflows/release.yml` is a manual release workflow. It:

1. Authenticates to GCP through GitHub OIDC/Workload Identity Federation
2. Builds the backend container
3. Publishes an immutable version tag and commit-SHA tag
4. Uses GitHub's protected `production` environment

Configure these repository or environment variables before using it:

```text
GCP_PROJECT_ID
GCP_WORKLOAD_IDENTITY_PROVIDER
GCP_DEPLOYER_SERVICE_ACCOUNT
```

Do not replace this with a long-lived service-account JSON key.

### Promotion model

The desired promotion flow is:

```text
build once
  -> deploy image SHA to dev
  -> automated smoke/integration tests
  -> promote the same image to staging
  -> approval
  -> promote the same image to production
```

Use semantic versioning for releases:

```text
v1.0.0   # first stable release
v1.1.0   # backward-compatible feature
v1.1.1   # backward-compatible fix
```

Each release should include release notes, migration notes, known risks,
monitoring checks, and rollback instructions.

## Environments

| Environment | Purpose | Deployment | Data |
|---|---|---|---|
| Local | Developer feedback | Manual/Docker | H2 or local PostgreSQL |
| Dev | Continuous integration environment | Automatic after merge | Disposable dev data |
| Staging/simulation | Production-like verification | Promotion/approval | Isolated realistic data |
| Production | Real users and integrations | Protected approval | Cloud SQL with backups |

Environment configuration and credentials must never be copied between
environments. Use Secret Manager, Kubernetes secret references, or an approved
external secrets solution. Do not commit real secret manifests.

## Security

Current controls include:

- JWT authentication
- Role-based authorization
- API keys for public write endpoints
- Separate integration keys
- Environment-provided secrets
- Non-root container
- Dropped Linux capabilities
- Kubernetes security context
- GitHub OIDC design instead of long-lived GCP keys

Production hardening still includes:

- Flyway or Liquibase database migrations
- Least-privilege GCP IAM
- Secret Manager integration
- Dependency and container vulnerability scanning
- CodeQL and secret scanning
- Signed images and SBOMs
- Network policies
- Rate limiting and API abuse protection
- Audit logs for approvals and privileged actions
- Regular backup restoration tests

Never commit `JWT_SECRET`, API keys, database passwords, service-account keys,
`.env` files, or customer data.

## Testing strategy

Testing should cover both application behavior and platform behavior:

| Test type | Examples |
|---|---|
| Unit | Services, validation, authorization rules |
| Controller | HTTP status, JSON shape, security rules |
| Integration | Spring context and PostgreSQL with Testcontainers |
| Contract | Provider and project-management API compatibility |
| Frontend | Components, routes, forms, API states |
| End-to-end | Login, request, offer, evaluation, order approval |
| Smoke | Health endpoint and critical workflow after deployment |
| Load | Request/offer/order traffic with k6 |
| Recovery | Rollback, backup restoration, failed migration |

The current baseline tests the backend application context and frontend login
route. Increasing business and integration coverage is an intentional next
step.

## Local setup

### Prerequisites

- Git
- Java 21
- Node.js 22 and npm
- Docker
- Maven wrapper support
- Helm for chart validation
- PostgreSQL, or H2 for the test profile

### Clone the repository

```bash
git clone https://github.com/BidhanPaul/ServiceManagementSystem.git
cd ServiceManagementSystem
```

### Run backend tests and build

```bash
cd Service-Management
bash mvnw test
bash mvnw verify
```

The wrapper can be made executable on Unix systems:

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

### Run frontend

```bash
cd frontend
npm ci
npm start
```

The frontend runs on `http://localhost:3000` and the backend on
`http://localhost:8080`.

### Validate the container and Helm chart

```bash
docker build --check Service-Management
docker build -t service-management:local Service-Management

helm lint helm/service-management
helm template service-management helm/service-management \
  --set image.tag=local
```

### Required local configuration

Use local environment variables or an untracked `.env` file. Never put real
values in Git:

| Variable | Purpose |
|---|---|
| `DB_URL` | Database JDBC URL |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key |
| `PUBLIC_BIDDING_API_KEY` | Public bidding protection |
| `GROUP3_API_KEY` | Provider integration authentication |
| `GROUP4_API_KEY` | Order-change callback authentication |

## Operational checklist

Before a production release:

- [ ] Pull request checks pass
- [ ] Image uses an immutable tag
- [ ] Dependency and image scans pass
- [ ] Database migration is reviewed and reversible
- [ ] Secrets are available from Secret Manager or secret references
- [ ] Readiness and liveness probes work
- [ ] Resource limits are appropriate
- [ ] Smoke tests are prepared
- [ ] Dashboards and alerts are available
- [ ] Rollback command or GitOps commit is known
- [ ] Release notes and incident owner are identified

After deployment:

- [ ] Rollout reaches the expected replica count
- [ ] Health checks remain healthy
- [ ] Error rate and latency are normal
- [ ] Database connections and resources are healthy
- [ ] External integrations respond successfully
- [ ] Critical user journey smoke test passes

## Learning roadmap

This project is intended to teach DevOps progressively:

1. Understand the application and its local development workflow.
2. Improve backend, frontend, integration, and database test coverage.
3. Add Flyway/Liquibase migrations and Testcontainers.
4. Build secure, reproducible containers.
5. Create GCP resources with Terraform.
6. Learn IAM, VPC, Artifact Registry, GKE, Cloud SQL, and Secret Manager.
7. Deploy the Helm chart to a disposable GKE development environment.
8. Add Workload Identity Federation and eliminate long-lived credentials.
9. Create a separate GitOps repository and install Argo CD.
10. Promote one immutable image through dev, staging, and production.
11. Add security scanning, SBOMs, image signing, and policy checks.
12. Add logs, metrics, traces, dashboards, alerts, and SLOs.
13. Practice releases, rollbacks, incident response, backups, and recovery.
14. Use AI for test generation, incident analysis, documentation, and review
    while protecting secrets and validating every generated change.

The detailed staged plan is in
[`docs/DEVOPS-LEARNING-ROADMAP.md`](docs/DEVOPS-LEARNING-ROADMAP.md).

## Related project

[Process-Documentation-Workflow-Automation](https://github.com/BidhanPaul/Process-Documentation-Workflow-Automation)
is a Python analytics and process-governance layer built on top of this
system's process data. It computes KPIs, detects SLA breaches, and provides
Excel and desktop dashboards.

## License

MIT — see [LICENSE](LICENSE).
