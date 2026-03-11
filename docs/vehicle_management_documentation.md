# Operational Blueprint: Vehicle Management Module (VMM)

## Part I: Business Requirements Document (BRD)

### 1. Executive Summary
The Vehicle Management Module (VMM) is a core component of the YKK ERP Solution, designed to provide absolute visibility and governance over the organization's fleet assets. The system transitions traditional fleet tracking into a high-fidelity digital ecosystem, ensuring operational efficiency, safety compliance, and financial transparency.

### 2. Project Scope
The VMM encompasses the entire lifecycle of a vehicle within the organization, including:
- **Asset Registry**: Centralized database of technical specifications and ownership.
- **Personnel Management**: Comprehensive driver profiles and licensing verification.
- **Operational Logistics**: Real-time trip logging, route management, and itinerary tracking.
- **Technical Maintenance**: Preventive and corrective service history with parts-level cost auditing.
- **Incident Governance**: Official accident reporting, insurance claim tracking, and damage assessment.
- **Analytical Intelligence**: Real-time dashboards and multi-dimensional lifecycle reports.

### 3. Business Objectives
- **Operational Efficiency**: Minimize vehicle downtime through proactive maintenance scheduling and real-time status tracking.
- **Cost Optimization**: Detailed auditing of trip expenses, fuel costs, and repair bills.
- **Compliance & Safety**: Enforce digital vaulting of mandatory documents (RC, Insurance, Fitness, Licenses) with expiry tracking.
- **Asset Longevity**: Monitor the "Health Pulse" of each asset via the Vehicle Lifecycle Report.

---

## Part II: Software Requirements Specification (SRS)

### 1. System Perspective
The VMM is a client-side reactive application built on Next.js 14+, leveraging Firebase Firestore for real-time data synchronization. It operates within a secure organizational handshake, ensuring that sensitive fleet data is only accessible to authorized corporate personnel.

### 2. Functional Requirements

#### 2.1 Fleet Asset Management
- **V-REG-001**: The system shall record comprehensive vehicle data including Registration No, Engine/Chassis No, Brand, Model, and Manufacture Year.
- **V-REG-002**: The system shall support digital document vaulting for RC, Insurance, and Fitness certificates.
- **V-REG-003**: The system shall track driver assignment history with effective dates to maintain a non-repudiable audit trail of vehicle custody.

#### 2.2 Driver Management
- **D-MGMT-001**: The system shall maintain professional driver profiles including Father's name, DOB, and high-fidelity profile pictures.
- **D-MGMT-002**: The system shall enforce license verification by recording License Number, Class (Light/Heavy), and Expiry Dates.
- **D-MGMT-003**: The system shall provide an "Employment Verification" matrix including Joining Date, Shift, and Supervisor.

#### 2.3 Trip & Logistics Execution
- **T-LOG-001**: The system shall record trips with multi-stop itineraries, capturing precise start/end odometer readings.
- **T-LOG-002**: The system shall track trip-specific expenses categorized by type (Fuel, Toll, Parking, etc.).
- **T-LOG-003**: The system shall support "Trip Status" transitions: Planned -> Ongoing -> Completed.

#### 2.4 Maintenance & Technical Audit
- **M-AUDIT-001**: The system shall log maintenance jobs including service type, garage identification, and actual service date.
- **M-AUDIT-002**: The system shall record parts-level details including Brand, Quantity, Price, and Warranty.
- **M-AUDIT-003**: The system shall allow forecasted "Next Service" dates to enable preventive maintenance planning.

#### 2.5 Accident & Incident Governance
- **A-GOV-001**: The system shall record incident metrics including Collision Type, Severity, Fault Status, and precise location.
- **A-GOV-002**: The system shall track legal filings, including Police GD/FIR numbers and Insurance Claim references.
- **A-GOV-003**: The system shall support "Before/After" photo evidence vaulting for damage assessment.

### 3. Data Entities (Firestore Schema Analysis)

| Entity | Primary Keys | Key Properties |
| :--- | :--- | :--- |
| `vehicles` | `id`, `vehicleIdCode` | `registrationNumber`, `brandId`, `status`, `driverAssignmentHistory` |
| `drivers` | `id`, `driverIdCode` | `name`, `licenseExpiryDate`, `assignedVehicleId`, `documents` |
| `trips` | `id`, `tripId` | `vehicleId`, `stops`, `startingMeter`, `endingMeter`, `expenses` |
| `maintenanceRecords` | `id` | `serviceDate`, `parts`, `expenses`, `serviceCenterId` |
| `accidents` | `id`, `accidentId` | `severityLevelId`, `policeReportFiled`, `estimatedRepairCost` |

### 4. User Interface Requirements
- **High-Fidelity Interaction**: The module utilizes ShadCN components for a professional, responsive layout.
- **Analytical Dashboards**: Integrated Recharts components provide visual distributions of Vehicle Status and Monthly Cost Trends.
- **Physical Output Standards**: The module includes a "Print Driver" system that generates high-fidelity, A4-optimized physical reports for Drivers, Vehicles, Trips, and Accidents.

### 5. Security & Privacy
- **Identity-Aware Guard**: Access is restricted to users with a verified "Corporate Identity" (Employee profile or Superadmin).
- **Row-Level Security**: Firestore security rules ensure that authenticated users can only perform authorized operations.
- **Document Integrity**: Immutability logic prevents the deletion of historical audit logs (Trips/Maintenance) without administrative overrides.
