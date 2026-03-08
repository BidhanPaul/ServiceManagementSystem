# Service Management System

A Spring Boot REST API backend for managing service requests, provider bidding, offer evaluation, and order lifecycle management. Designed to integrate with external provider and contract management systems.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Roles & Permissions](#roles--permissions)
- [Core Workflows](#core-workflows)
- [API Endpoints](#api-endpoints)
- [External Integrations](#external-integrations)
- [Security](#security)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Overview

The Service Management System handles the end-to-end process of sourcing and managing service providers within an enterprise context. The typical flow is:

1. A **Project Manager** creates a service request
2. A **Procurement Officer** reviews and approves the request for bidding
3. Service providers submit offers during a configurable bidding window
4. A **Resource Planner** evaluates offers and places a service order
5. The order goes through an approval lifecycle with support for substitutions and extensions

---

## Tech Stack

- **Java 17+** / **Spring Boot**
- **Spring Security** with JWT authentication
- **Spring Data JPA** (PostgreSQL / H2 for dev)
- **Spring Scheduling** for automated bidding cycle management
- **REST** with JSON
- **Swagger / OpenAPI** (`/swagger-ui`)

---

## Architecture

```
controller/        REST endpoints (one controller per domain)
service/           Business logic (interface + Impl pattern)
repository/        Spring Data JPA repositories
model/             JPA entities and enums
dto/               Request/response transfer objects
security/          JWT filter, API key filter, Spring Security config
integration/       HTTP clients for external systems (Group 3, Provider Management)
exception/         Global exception handling
config/            Scheduling config
```

The application follows a layered architecture: Controllers delegate to Services, which use Repositories for persistence. External system calls are isolated in the `integration/` package.

---

## Roles & Permissions

| Role | Description |
|---|---|
| `ADMIN` | Full access, user stats dashboard |
| `PROJECT_MANAGER` | Create and reactivate service requests, submit order feedback |
| `PROCUREMENT_OFFICER` | Approve or reject service requests |
| `RESOURCE_PLANNER` | Pull provider offers, trigger evaluations, create and approve orders |
| `SERVICE_PROVIDER` | Submit offers on open requests (public, no login required) |
| `SUPPLIER_REPRESENTATIVE` | Reserved for future use |
| `PROVIDER_ADMIN` | Reserved for future use |
| `CONTRACT_COORDINATOR` | Reserved for future use |

---

## Core Workflows

### Service Request Lifecycle

```
DRAFT → IN_REVIEW → APPROVED_FOR_BIDDING → BIDDING → EVALUATION → ORDERED → COMPLETED
                  ↘ REJECTED              ↘ EXPIRED (no offers received)
```

- Requests are created by Project Managers and reviewed by Procurement Officers
- Once approved, a configurable bidding window opens (e.g. 3, 7, or 14 days; 0 = instant for demos)
- The `BiddingCycleScheduler` runs every 2 seconds to auto-expire requests when their bidding window closes

### Service Order Lifecycle

```
PENDING_RP_APPROVAL → SUBMITTED_TO_PROVIDER → APPROVED
                                             ↘ REJECTED
```

Orders support two change request types:
- **Substitution** – replace the assigned specialist
- **Extension** – extend the contract end date, man-days, and value

Change requests follow their own approval flow (`OrderChangeStatus`: NONE / PENDING / APPROVED / REJECTED).

### Offer Evaluation

Resource Planners can trigger automated scoring of submitted offers via `POST /api/requests/{id}/offers/evaluation/compute`. Evaluations are stored as `OfferEvaluation` records linked to each offer.

---

## API Endpoints

### Authentication
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive a JWT token |

### Service Requests
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/requests` | Public | List all service requests |
| GET | `/api/requests/{id}` | Public | Get a single request |
| POST | `/api/requests` | PROJECT_MANAGER | Create a new service request |
| PUT | `/api/requests/{id}/approve` | PROCUREMENT_OFFICER | Approve a request |
| PUT | `/api/requests/{id}/reject` | PROCUREMENT_OFFICER | Reject a request |
| PUT | `/api/requests/{id}/reactivate` | PROJECT_MANAGER | Reactivate a request |

### Offers
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/requests/{id}/offers` | Public (API key) | Submit an offer on a request |
| POST | `/api/requests/{id}/pull-provider-offers` | RESOURCE_PLANNER | Pull offers from external provider system |
| POST | `/api/requests/{id}/offers/evaluation/compute` | RESOURCE_PLANNER | Compute offer evaluations |
| GET | `/api/public/offers` | Public | List public offers |
| GET | `/api/public/evaluations` | Public | List public evaluations |

### Service Orders
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/requests/offers/{offerId}/order` | RESOURCE_PLANNER | Create an order from an offer |
| POST | `/api/orders/{id}/approve` | RESOURCE_PLANNER | Approve an order |
| POST | `/api/orders/{id}/reject` | RESOURCE_PLANNER | Reject an order |
| POST | `/api/orders/{id}/feedback` | PROJECT_MANAGER | Submit feedback on a completed order |

### Order Changes
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/public/order-changes/extension` | Public (API key) | Request an order extension |
| POST | `/api/public/order-changes/substitution` | Public (API key) | Request a specialist substitution |
| POST | `/api/orders/{id}/change/approve` | RESOURCE_PLANNER | Approve a change request |
| POST | `/api/orders/{id}/change/reject` | RESOURCE_PLANNER | Reject a change request |

### Notifications & Messaging
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/notifications/user/{username}` | Authenticated | Get notifications for a user |
| GET | `/api/notifications/admin` | ADMIN | Get all admin notifications |
| POST | `/api/notifications/dm` | Authenticated | Send a direct message |

### Admin
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/admin/stats` | Authenticated | User count breakdown by role |

### Public Bidding
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/public/bids` | Public (API key) | Submit a bid via public endpoint |

### External Reference
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/external/**` | Public | Fetch reference data (projects, contracts) for dropdowns |

---

## External Integrations

### Group 3 – Provider Management System

**Base URL:** `https://provider-management-system-production.up.railway.app`

The system integrates with an external provider management platform to:
- Pull available provider offers into a request (`ProviderManagementClient`)
- Send offer decisions back (SUBMITTED / ACCEPTED / REJECTED) via `Group3IntegrationClient`

Inbound callbacks from Group 3 are handled by `Group3IntegrationController` at `/api/integrations/group3/**`.

### Group 4 – Order Change Decisions

Incoming order change decisions from Group 4 are handled by `Group4OrderChangeDecisionController`.

---

## Security

Authentication uses **JWT tokens** issued at login. Tokens encode the user's username and role and are validated on every request by `JwtAuthFilter`.

Public write endpoints (offer submission, bidding, order changes) are additionally protected by a **Public API Key** checked by `PublicApiKeyFilter`. Callers must include the key in their request headers.

CORS is configured to allow:
- `http://localhost:3000` (local development)
- `https://servicemanagementsystem-og8h.onrender.com` (production frontend)

---

## Getting Started

### Prerequisites

- Java 17+
- Maven or Gradle
- PostgreSQL (or H2 for local dev)

### Run locally

```bash
# Clone the repo
git clone <repo-url>
cd service-management

# Set required environment variables (see below)
export GROUP3_API_KEY=your_key_here
export PUBLIC_API_KEY=your_key_here

# Build and run
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`.

API docs are available at `http://localhost:8080/swagger-ui`.

H2 console (dev only) is available at `http://localhost:8080/h2-console`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROUP3_API_KEY` | API key for authenticating calls to the Group 3 provider management system |
| `PUBLIC_API_KEY` | API key required for external parties submitting offers or order changes via public endpoints |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `DATABASE_URL` | JDBC URL for the production database |
