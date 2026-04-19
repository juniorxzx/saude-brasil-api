<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the relevant plan:

**Current Feature**: Validação e Documentação de Autenticação de Endpoints

- Spec: specs/003-authentication-validation/spec.md
- Plan: specs/003-authentication-validation/IMPL_PLAN.md
- Research: specs/003-authentication-validation/research.md
- Contracts: specs/003-authentication-validation/contracts/api.md

**Previous Feature** (Healthcare Backend Standards - Completed):
specs/001-healthcare-backend-standards/IMPL_PLAN.md

<!-- SPECKIT END -->

# Saúde Brasil API - Module Responsibilities

## Project Overview

This is a healthcare backend API built with NestJS that implements authentication, patient profile management, medical records, and audit logging with security-first architecture.

---

## Module Responsibilities

### 1. **Auth Module** (`src/auth/`)

**Purpose**: Handle user authentication and authorization

**Components**:

- `auth.service.ts` - Core authentication logic (register, login, refresh token, current user)
- `auth.controller.ts` - HTTP endpoints for auth operations
- `jwt.strategy.ts` - Passport JWT strategy for token validation
- `jwt-auth.guard.ts` - Route guard for JWT-protected endpoints
- `roles.guard.ts` - Role-based access control (RBAC) guard
- `roles.decorator.ts` - Decorator for role-based access control
- `get-user.decorator.ts` - Decorator to extract current user from JWT
- `login.dto.ts` - Login request DTO
- `refresh.dto.ts` - Refresh token request DTO
- `auth-service.interface.ts` - Service interface for dependency injection

**Key Features**:

- JWT authentication with access & refresh tokens (1hr & 7d expiry)
- User registration with role-based validation (DOCTOR, PATIENT, CLINIC_MANAGER, ADMIN)
- Password hashing with bcrypt
- Audit logging for login/logout/registration events
- Role-based authorization via guards and decorators

---

### 2. **Users Module** (`src/users/`)

**Purpose**: Manage user accounts and profiles

**Components**:

- `user.service.ts` - User CRUD operations and management
- `user.controller.ts` - HTTP endpoints for user management
- `create-user.dto.ts` - User creation request DTO
- `update-user.dto.ts` - User update request DTO
- `user-service.interface.ts` - Service interface

**Key Features**:

- Create/read/update users with proper validation
- Role-based user creation (enforces CRM for doctors, CNPJ for clinic managers)
- Audit logging for user operations (creation, updates)
- User status management (PENDING_VERIFICATION, ACTIVE, INACTIVE)
- Soft delete capability through status updates

**Audit Tracking**:

- USER_CREATE, USER_READ, USER_UPDATE actions logged

---

### 3. **Patient Profile Module** (`src/patient-profile/`)

**Purpose**: Manage patient personal and medical information

**Components**:

- `patient-profile.service.ts` - Patient profile operations
- `patient-profile.controller.ts` - HTTP endpoints
- `create-patient-profile.dto.ts` - Profile creation DTO
- `update-patient-profile.dto.ts` - Profile update DTO
- `patient-profile-service.interface.ts` - Service interface

**Key Features**:

- Patient profile creation and updates
- Encrypted storage of sensitive fields:
  - Allergies
  - Medications
  - Medical conditions
- Access control (patients can only access their own profiles)
- Audit logging for profile access and modifications

**Audit Tracking**:

- PROFILE_READ, PROFILE_UPDATE actions logged
- User ID recorded for access tracking

---

### 4. **Medical Records Module** (`src/medical-records/`)

**Purpose**: Handle creation, storage, and retrieval of medical records

**Components**:

- `medical-records.service.ts` - Medical record CRUD and business logic
- `medical-records.controller.ts` - HTTP endpoints
- `create-medical-record.dto.ts` - Record creation DTO
- `update-medical-record.dto.ts` - Record update DTO
- `medical-attachment.dto.ts` - File attachment metadata DTO
- `medical-record-service.interface.ts` - Service interface

**Key Features**:

- Medical record creation by doctors/clinic managers
- Encrypted description field (AES-256)
- Support for file attachments (max 50MB per file)
- Role-based access control:
  - Doctors can only access records they created
  - Patients can only access their own records
- Audit logging for all record operations

**Audit Tracking**:

- RECORD_CREATE, RECORD_READ, RECORD_UPDATE, RECORD_DELETE actions logged

---

### 5. **Audit Module** (`src/audit/`)

**Purpose**: Log and track all system actions for compliance and security

**Components**:

- `audit.service.ts` - Audit logging operations
- `audit.controller.ts` - Admin endpoints for audit log retrieval
- Specific logging methods for each module's actions

**Key Features**:

- Centralized audit log creation
- Masked sensitive data (emails, CPF, etc.) in logs
- Flexible query interface for admins:
  - Filter by userId, action, resource
  - Date range filtering
  - Pagination support
- Error resilience (doesn't throw on logging failures)

**Audit Actions Tracked**:

- AUTH: LOGIN, LOGOUT, LOGIN_FAILED, REGISTER
- USERS: USER_READ, USER_UPDATE, USER_CREATE
- PROFILES: PROFILE_READ, PROFILE_UPDATE
- RECORDS: RECORD_READ, RECORD_CREATE, RECORD_UPDATE, RECORD_DELETE

---

### 6. **Prisma Module** (`src/prisma/`)

**Purpose**: Database connection and ORM layer

**Components**:

- `prisma.service.ts` - PrismaClient singleton and connection management
- `prisma.module.ts` - Module configuration for dependency injection

**Key Features**:

- PostgreSQL database connection via Prisma ORM
- Global provider for all modules
- Connection lifecycle management (onModuleInit, onModuleDestroy)

---

### 7. **Common Module** (`src/common/`)

**Purpose**: Shared services and utilities

**Components**:

- **Services**:
  - `encryption.service.ts` - AES-256 encryption/decryption for sensitive fields
- **Filters**:
  - `global-exception.filter.ts` - Global error handler with data masking
- **Config**:
  - `security.constants.ts` - Security configurations (JWT expiry, encryption key length, salt rounds)
  - `env.schema.ts` - Environment variable validation schema

**Key Features**:

- Centralized encryption service
- Consistent error handling across all modules
- Data masking for sensitive information in error responses

---

## Security Architecture

### 1. **Authentication & Authorization**

- JWT-based stateless authentication
- Separate access tokens (1hr) and refresh tokens (7 days)
- Role-based access control with decorators
- Route guards for protection

### 2. **Data Protection**

- AES-256 encryption for sensitive fields:
  - Medical record descriptions
  - Patient allergies, medications, conditions
- Password hashing with bcrypt (10 salt rounds)
- Environment variable injection for secrets

### 3. **Audit & Compliance**

- Comprehensive audit logging of all operations
- Email masking in audit logs
- Admin-accessible audit log queries
- Timestamp tracking for all actions

### 4. **Network Security**

- Helmet.js for HTTP security headers
- CORS configured for allowed origins
- Rate limiting (10 req/min for auth, 100 req/min for API)
- Global exception filter with masked error messages

---

## Data Model Summary

### Entities

- **User**: Core user account with roles (DOCTOR, PATIENT, CLINIC_MANAGER, ADMIN)
- **PatientProfile**: Patient personal & medical information (encrypted)
- **MedicalRecord**: Doctor-created medical records with encrypted descriptions
- **MedicalAttachment**: File attachments to medical records
- **AuditLog**: Complete audit trail of system actions

### Relationships

```
User (1) ──→ (∞) PatientProfile
User (Doctor) (1) ──→ (∞) MedicalRecord
User (Patient) (1) ──→ (∞) MedicalRecord (as patient)
MedicalRecord (1) ──→ (∞) MedicalAttachment
AuditLog references User & Resource
```

---

## Environment Variables Required

```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=[strong-random-secret-for-access-tokens]
JWT_REFRESH_SECRET=[strong-random-secret-for-refresh-tokens]
ENCRYPTION_KEY=[32-byte-hex-string-for-aes256]
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
PORT=3000
```

---

## Key Implementation Notes

### Type Safety

The codebase uses TypeScript strict mode with some pragma eslint-disable comments for Prisma-related `any` types, which are necessary due to Prisma's dynamic typing. These are intentional and documented.

### Testing

- Unit tests for core services: AuthService, EncryptionService, AuditService
- Test coverage focused on authentication, encryption, and audit logging
- E2E tests for integration scenarios

### Code Quality

- ESLint configured for type safety
- Prettier formatting applied
- Follows NestJS best practices and patterns
