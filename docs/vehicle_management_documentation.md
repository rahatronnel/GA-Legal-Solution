# Operational Blueprint: Vehicle Management Module (VMM)

## 1. Project Overview
**Project Name:** Vehicle Management Module (VMM) – YKK ERP Solution  
**Background:** The organization currently manages a diverse fleet of vehicles and professional drivers using fragmented systems. This project centralizes these operations into a high-fidelity digital ecosystem.  
**Purpose:** To provide a single source of truth for all fleet-related data, ensuring operational transparency and resource optimization.  
**Business Problem:** Lack of real-time visibility into vehicle status, high untracked maintenance costs, manual trip logging errors, and compliance risks regarding document expiries (Licenses, Insurance, Fitness).

## 2. Business Objectives
**Main Goals:**
*   Implement a centralized registry for all vehicles and drivers.
*   Automate the tracking of trips, itineraries, and associated expenses.
*   Create a non-repudiable audit trail for maintenance and accidents.
*   Digitize physical document storage for legal compliance.

**Expected Benefits:**
*   **Cost Reduction:** Improved oversight of maintenance and fuel/trip expenses.
*   **Asset Longevity:** Proactive preventive maintenance tracking.
*   **Risk Mitigation:** Real-time visibility into accident trends and driver fault status.
*   **Operational Speed:** Instant generation of high-fidelity A4 printable reports.

**KPIs / Success Criteria:**
*   99.9% data accuracy in vehicle deployment logs.
*   100% digitization of mandatory vehicle/driver documents.
*   Zero missing trip expense reports.

## 3. Scope of the Project
**In Scope:**
*   **Asset Registry:** Registration No, Engine/Chassis No, Brand, Model, and Manufacture Year.
*   **Personnel Management:** Professional driver profiles and licensing verification.
*   **Operational Logistics:** Real-time trip logging, route management, and itinerary tracking.
*   **Technical Maintenance:** Preventive and corrective service history with parts-level cost auditing.
*   **Incident Governance:** Official accident reporting, insurance claim tracking, and damage assessment.
*   **Print Driver System:** High-fidelity A4 output for all entities.

**Out of Scope:**
*   Real-time GPS hardware integration (Live Map Tracking).
*   External Fuel Station API integrations.
*   Automated Insurance renewal payments.

## 4. Stakeholders
*   **Project Sponsor:** YKK Executive Management.
*   **Business Owner:** Operations and Logistics Department.
*   **Project Manager:** ERP Implementation Lead.
*   **Development Team:** App Prototyper (Firebase Studio).
*   **End Users:** Fleet Operators, Admin Personnel, and Drivers.

## 5. Business Requirements
*   **Asset Governance:** System must record comprehensive vehicle specifications and assignments.
*   **Personnel Oversight:** System must track driver eligibility and licensing status.
*   **Logistics Auditing:** System must record multi-stop itineraries and odometer variances.
*   **Technical Accountability:** Every maintenance job must be linked to a specific garage and parts list.
*   **Safety Compliance:** Every incident must be documented with visual evidence and legal filing status.

## 6. Functional Requirements
*   **Authentication:** Multi-role access (Admin, Operator, Driver, Viewer).
*   **Dynamic Dashboard:** Visual distribution of vehicle status and monthly cost trends via Recharts.
*   **Data Entry:** Multi-step ShadCN forms for complex data sets (Trips/Maintenance).
*   **Cloud Sync:** Real-time synchronization via Firestore for multi-terminal access.
*   **Evidence Vault:** Base64-based document storage for RC, NID, and Invoices.
*   **Filtering:** Advanced filtering by Vehicle, Driver, Date Range, and Status.

## 7. Non-Functional Requirements
*   **Performance:** UI interactions must remain fluid under heavy data load.
*   **Security:** Row-level security through Firestore rules ensuring private data isolation.
*   **Scalability:** Architecture must support the addition of unlimited fleet assets.
*   **Reliability:** High availability via Google Cloud infrastructure.
*   **Data Integrity:** Immutability of historical logs (Trips/Maintenance) without admin override.

## 8. Process Flow / Workflow
1.  **Onboarding:** Admin registers a new Vehicle and Driver.
2.  **Assignment:** Driver is formally assigned to a Vehicle with an effective date.
3.  **Deployment:** Operator logs a Trip (Planned -> Ongoing -> Completed).
4.  **Maintenance:** If vehicle requires service, a Maintenance Record is logged with parts used.
5.  **Incident:** If an accident occurs, an Accident Report is filed with evidence.
6.  **Reporting:** Management reviews the Dashboard or generates physical A4 reports for audit.

## 9. Data Requirements
**Primary Entities:**
*   `vehicles`: Core technical and ownership data.
*   `drivers`: Personnel, license, and assignment history.
*   `trips`: Itinerary, odometer, and expense objects.
*   `maintenanceRecords`: Service dates, parts list, and costs.
*   `accidents`: Severity, fault status, and legal documentation.
*   `masterData`: Routes, Locations, Trip Purposes, Expense Types.

## 10. Assumptions & Constraints
*   **Assumptions:** All users have access to an internet-enabled terminal (Desktop/Mobile).
*   **Constraints:** Firestore 1MB document limit necessitates aggressive Base64 image compression (~120KB target).
*   **Constraint:** The system currently operates as a client-side reactive app (Next.js).

## 11. Timeline / Milestones
*   **Phase I:** Foundation - Master Data Registry & Locations.
*   **Phase II:** Personnel & Assets - Driver/Vehicle Onboarding.
*   **Phase III:** Execution - Trip Logging & Expense Tracking.
*   **Phase IV:** Governance - Maintenance, Accidents & Analytical Reports.

## 12. Approval Section
**Confirmed By:** _________________________ (Project Sponsor)  
**Date:** _________________________  
**Verified By:** _________________________ (Logistics Head)  
**Date:** _________________________