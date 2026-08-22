# BEOS Development Rules

## Project

Bikash Engineering Pvt. Ltd.

BEOS — Bikash Engineering Operating System

Location: Pokhara, Nepal

Initial operating area: Nepal

Company type: Multidisciplinary Engineering and Technology Company

Established: 2023 AD

Employees: 50+

Branches/offices: 3+

---

# 1. Core Objective

BEOS is the digital operating system of Bikash Engineering Pvt. Ltd.

It will integrate:

- Company communication
- Meetings
- Discussion
- Project management
- Customer management
- Quotation
- Sales
- Billing
- Inventory
- Accounting
- HR
- Assets
- Service/AMC
- Engineering operations
- Agriculture technology
- AI
- IoT
- E-commerce

BEOS must be developed as one integrated platform rather than many disconnected applications.

---

# 2. Development Principle

Build BEOS incrementally.

Never generate the entire system at once.

Each feature must be:

1. Designed
2. Implemented
3. Tested
4. Committed to Git
5. Documented
6. Then followed by the next feature

---

# 3. Current Technology Stack

Web:

- Next.js
- TypeScript
- React

Backend:

- NestJS
- TypeScript

Database:

- PostgreSQL 18
- Prisma ORM

Package manager:

- pnpm

Repository:

- Git

---

# 4. Architecture

BEOS uses a modular-monolith architecture initially.

Applications:

apps/web
    Public website
    Employee workspace
    Customer portal

apps/api
    Backend API
    Authentication
    Business logic
    Database access

packages/
    Shared code and types

docs/
    BEOS documentation

---

# 5. Database Rules

PostgreSQL is the primary database.

Prisma is the database access layer.

Never use:

- database reset
- destructive migration
- DROP DATABASE
- DELETE production data

without explicit approval.

Never store passwords in plaintext.

Never store secrets in source code.

---

# 6. Security

Security must be enforced by the backend.

Frontend hiding is NOT security.

Every sensitive operation must verify:

- authentication
- authorization
- role
- permission

Sensitive financial information must not be visible to ordinary employees.

Important actions should be recorded in AuditLog.

---

# 7. Main Roles

The system must eventually support:

- Super Admin
- Director
- Manager
- Accountant
- Engineer
- Storekeeper
- Technician
- HR
- Sales
- Customer

The permission system must be flexible enough to add additional roles later.

---

# 8. Branches

BEOS must support multiple branches/offices.

Important company records should be associated with:

- branch
- department
- responsible employee

The system must not assume that Bikash Engineering has only one office.

---

# 9. Languages

BEOS will support:

- English
- Nepali

Internationalization should be considered from the beginning.

Do not hard-code large amounts of user-facing text into business logic.

---

# 10. Mobile

A mobile application will eventually support:

- Android
- iPhone

Field engineers and technicians must eventually be able to work offline.

Offline data must synchronize safely when connectivity returns.

---

# 11. AI

BEOS will eventually contain an AI assistant.

AI may assist with:

- search
- reports
- document analysis
- company knowledge
- recommendations
- workflow automation

AI actions affecting:

- money
- inventory
- employees
- customers
- projects
- permissions

must pass through normal authorization and audit systems.

AI must never bypass security permissions.

---

# 12. First Business Priority

The first major business module is:

## Company Workspace

It will eventually contain:

- Company Feed
- Announcements
- Posts
- Comments
- Discussions
- Direct Messages
- Group Discussions
- Meetings
- Meeting Agenda
- Meeting Participants
- Meeting Notes
- Meeting Minutes
- Decisions
- Tasks
- File sharing
- Notifications

The interface should feel modern and familiar, similar to professional collaboration platforms.

---

# 13. Future Major Modules

## Customer

- Customer accounts
- Customer portal
- Quotations
- Orders
- Projects
- Invoices
- Payments
- Documents
- Warranty
- Project progress
- Service requests

## Sales

Quotation
→ Sales Order
→ Invoice
→ Payment

## Inventory

- Electrical components
- Electronics
- Tools
- Machinery
- Spare parts
- Raw materials
- Finished products
- Purchase orders
- Suppliers
- Stock in/out
- Stock transfers
- Low-stock alerts
- Serial numbers
- Warranty
- Barcode
- QR
- Warehouse

## Accounting

- Cash
- Bank
- Mobile banking
- Receivable
- Payable
- Expenses
- Income
- Tax/VAT
- Profit/Loss
- Project profitability

## HR

- Employees
- Attendance
- Leave
- Payroll
- Documents
- Roles
- Performance
- Work assignments
- Field attendance
- GPS

## Assets

- Machinery
- Vehicles
- Tools
- Testing equipment
- Location
- Assigned employee
- Maintenance
- Service history
- Depreciation
- Warranty

## Engineering

- Electrical
- Electronics
- Civil
- Software/IT
- AI/IoT
- Automation
- Robotics

## Agriculture Technology

- Smart farming
- Agriculture applications
- Market management
- Wildlife management
- IoT systems
- AI assistance
- Government projects

## E-commerce

Online marketplace for:

- Electronic components
- Engineering equipment
- IoT products
- Automation products
- Smart farming products
- Home automation products

---

# 14. Government and Regulatory Requirements

The system must be designed so that Nepal-specific requirements can be integrated.

This includes electronic billing and applicable:

- VAT
- Tax
- Invoice
- Accounting
- Government reporting

requirements.

Do not claim regulatory compliance until the implementation has been specifically verified.

---

# 15. Coding Rules

Never rewrite unrelated files.

Never create duplicate modules.

Before creating a file:

1. Search for an existing implementation.
2. Reuse existing architecture.
3. Modify the smallest necessary number of files.

Prefer simple code over unnecessary abstraction.

Do not create microservices unless there is a demonstrated requirement.

---

# 16. Git Rules

Every completed feature must have a Git checkpoint.

Recommended sequence:

feature
→ test
→ fix
→ verify
→ git commit

Never continue building many features on top of an untested broken feature.

---

# 17. AI Coding Rules

AI coding tools must:

- inspect existing code first
- modify only required files
- avoid rewriting working modules
- avoid generating unnecessary dependencies
- avoid generating future modules prematurely
- explain database changes
- explain files created/modified
- report test results

If the existing architecture conflicts with a requested change, stop and explain the conflict.

Do not silently rewrite the architecture.

---

# 18. Current Development Status

Foundation:

- Git: COMPLETE
- pnpm workspace: COMPLETE
- Next.js: RUNNING
- NestJS: RUNNING
- PostgreSQL: INSTALLED
- Prisma: CONFIGURED
- Initial database migration: COMPLETE

Current phase:

## Phase 1 — Platform Foundation

Next feature:

## Identity & Access

After Identity & Access:

## Company Workspace