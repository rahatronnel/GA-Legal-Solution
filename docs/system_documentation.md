# System Documentation: Multi-Layer Bill Approval Workflow

## 1. Objective

To implement a sequential, multi-level approval workflow for bills submitted in the BillFlow module. The system allows a superadmin to define an ordered chain of employees who must approve a bill in sequence.

## 2. Data Structure

The core of this system is stored in the main organization settings document in Firestore.

- **File**: `docs/backend.json`
- **Entity**: `OrganizationSettings`
- **Key Field**: `billApprovalLevels`
  - **Type**: `array`
  - **Description**: This field holds an ordered array of **employee document IDs**. The order of IDs in this array defines the exact sequence of approval.
  - **Example**: `["employee_id_1", "employee_id_2", "employee_id_3"]`

The `Bill` entity contains the fields that track the approval state:
- `approvalStatus`: A number representing the bill's state (0: Rejected, 1: Approved, 2: Pending).
- `currentApproverId`: A string holding the employee ID of the person who currently needs to approve the bill.
- `approvalHistory`: An array of objects that logs each approval or rejection action, creating an audit trail.

## 3. Configuration

The approval workflow is configured by a superadmin.

- **Location**: BillFlow Module -> "Approval Settings" Tab.
- **Visibility**: This tab is only visible to the user logged in as `superadmin@galsolution.com`.
- **Functionality**:
  1. The UI displays a dynamic list representing the approval steps.
  2. The superadmin can add new steps to the chain.
  3. For each step, the superadmin selects an employee from a dropdown list.
  4. The superadmin can remove steps from the chain.
  5. Clicking "Save Approval Flow" stores the ordered array of employee IDs into the `billApprovalLevels` field in the `/settings/organization` document in Firestore.

## 4. Workflow Logic

The progression of a bill through the approval chain is deterministic and based on the `approvalHistory`.

### Bill Creation

- **File**: `src/app/billflow/components/bill-entry-form.tsx`
- **Logic**: When a new bill is created:
  1. The system reads the `billApprovalLevels` array from the organization settings.
  2. The bill's `approvalStatus` is set to `2` (Pending).
  3. The bill's `currentApproverId` is set to the **first employee ID** in the `billApprovalLevels` array (`billApprovalLevels[0]`). If the array is empty, it is set to an empty string.
  4. The `approvalHistory` array is initialized as empty.

### Approval Progression

- **File**: `src/app/billflow/bills/[id]/page.tsx`
- **Function**: `handleApproval(status)`
- **Logic**: When a user clicks "Approve" (status: `1`):
  1. A new entry is created for the `approvalHistory` containing the current user's ID, status, and timestamp.
  2. The system calculates the **current approval level** based on the new length of the `approvalHistory` array (`currentLevel = bill.approvalHistory.length + 1`).
  3. **It checks if this new level is less than the total number of required approvers** (`currentLevel < approvalLevels.length`).
     - **If YES (more approvers are needed):**
       - `approvalStatus` remains `2` (Pending).
       - `currentApproverId` is updated to the ID of the **next approver** in the sequence (`approvalLevels[currentLevel]`).
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
- `src/app/billflow/page.tsx`: Contains the UI for configuring the approval settings.
- `src/app/billflow/components/bill-entry-form.tsx`: Handles the creation of new bills and sets the initial approver.
- `src/app/billflow/bills/[id]/page.tsx`: Contains the primary logic (`handleApproval`) for progressing a single bill through the workflow.
- `src/app/billflow/components/bill-table.tsx`: Contains the logic for bulk approval and displaying the status of bills in the list.