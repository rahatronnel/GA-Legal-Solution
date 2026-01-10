
# System Documentation: Multi-Layer Bill Approval Workflow

## 1. Objective

To implement a sequential, multi-level approval workflow for bills submitted in the BillFlow module. The system allows a superadmin to define a dynamic, ordered chain of employees (from 1 to 10 steps) who must approve a bill in sequence. Each step in the flow is named for clarity.

## 2. Data Structure

The core of this system is stored in the main organization settings document in Firestore.

- **File**: `docs/backend.json`
- **Entity**: `OrganizationSettings`
- **Key Field**: `approvalFlow`
  - **Type**: `object`
  - **Description**: This object contains the entire definition for the active approval workflow.
  - **Properties**:
    - `effectiveDate` (`string`): The date from which this approval flow is active.
    - `steps` (`array`): An ordered array of objects, where each object defines one step in the approval sequence.
      - **Step Object Properties**:
        - `stepName` (`string`): The user-defined name for the step (e.g., "Initiator", "Reviewer").
        - `approverId` (`string`): The **employee document ID** of the person assigned to this step.
  - **Example**:
    ```json
    "approvalFlow": {
      "effectiveDate": "2024-01-01",
      "steps": [
        { "stepName": "Initiator", "approverId": "employee_id_1" },
        { "stepName": "Reviewer", "approverId": "employee_id_2" },
        { "stepName": "Final Approver", "approverId": "employee_id_3" }
      ]
    }
    ```

The `Bill` entity contains the fields that track the approval state:
- `approvalStatus`: A number representing the bill's state (0: Rejected, 1: Approved, 2: Pending).
- `currentApproverId`: A string holding the employee ID of the person who currently needs to approve the bill.
- `approvalHistory`: An array of objects that logs each approval or rejection action, creating an audit trail.

## 3. Configuration

The approval workflow is configured by a superadmin.

- **Location**: BillFlow Module -> "Approval Settings" Tab.
- **Visibility**: This tab is only visible to the user logged in as `superadmin@galsolution.com`.
- **Functionality**:
  1. The superadmin first selects the **Number of Approval Steps** (1 to 10) from a dropdown.
  2. The UI dynamically renders the selected number of steps, each with its predefined name (e.g., "Initiator").
  3. For each step, the superadmin selects an employee from a dropdown list.
  4. The superadmin sets an "Effective Date" for the workflow.
  5. Clicking "Save Approval Flow" stores the entire `approvalFlow` object into the `/settings/organization` document in Firestore.

## 4. Workflow Logic

The progression of a bill through the approval chain is deterministic and based on the `approvalHistory`.

### Bill Creation

- **File**: `src/app/billflow/components/bill-entry-form.tsx`
- **Logic**: When a new bill is created:
  1. The system reads the `approvalFlow.steps` array from the organization settings.
  2. The bill's `approvalStatus` is set to `2` (Pending).
  3. The bill's `currentApproverId` is set to the `approverId` of the **first step** (`approvalFlow.steps[0].approverId`).
  4. The `approvalHistory` array is initialized as empty.

### Approval Progression

- **File**: `src/app/billflow/bills/[id]/page.tsx` & `src/app/billflow/components/bill-table.tsx`
- **Function**: `handleApproval(status)` & `handleBulkApproval(status)`
- **Logic**: When a user clicks "Approve" (status: `1`):
  1. A new entry is created for the `approvalHistory` containing the current user's ID, status, and timestamp.
  2. The system calculates the **current approval level** based on the length of the `approvalHistory` array (`currentLevel = bill.approvalHistory.length`).
  3. **It checks if this new level is less than the total number of required approvers** (`currentLevel < approvalLevels.length`).
     - **If YES (more approvers are needed):**
       - `approvalStatus` remains `2` (Pending).
       - `currentApproverId` is updated to the ID of the **next approver** in the sequence (`approvalLevels[currentLevel].approverId`).
     - **If NO (this was the final approver):**
       - `approvalStatus` is set to `1` (Approved).
       - `currentApproverId` is cleared (set to `''`).
  4. If a user clicks "Reject" (status: `0`), the `approvalStatus` is immediately set to `0`, `currentApproverId` is cleared, and the process stops.
  5. All these changes are saved to the Firestore document for the bill in a single, atomic update.

### UI Permissions & Visibility

- **Files**: `src/app/billflow/components/bill-table.tsx` and `src/app/billflow/bills/[id]/page.tsx`
- **Logic**: The "Approve" and "Reject" buttons (and the bulk-approval checkboxes) are only visible and enabled if:
  1. The bill's `approvalStatus` is `2` (Pending).
  2. **AND** the logged-in user is either:
     - The `superadmin`.
     - **OR** their employee document ID matches the bill's `currentApproverId`.

## 5. Key Files for this System

- `docs/backend.json`: Defines the data structure.
- `src/app/billflow/page.tsx`: Contains the UI for configuring the new approval settings.
- `src/app/billflow/components/bill-entry-form.tsx`: Handles the creation of new bills and sets the initial approver.
- `src/app/billflow/bills/[id]/page.tsx`: Contains the primary logic (`handleApproval`) for progressing a single bill through the workflow.
- `src/app/billflow/components/bill-table.tsx`: Contains the logic for bulk approval and displaying the status of bills in the list.

    