
import type { Bill } from '../components/bill-entry-form';

type ApprovalFlow = Bill['approvalFlow'];

// New detailed status code mapping
const statusMap: { [key: number]: string } = {
    0: 'Rejected',
    1: 'Completed', // Final successful state
    2: 'Pending',   // Initial state before any approvals
    3: 'Pending Review',
    4: 'Reviewed',
    5: 'Checked',
    6: 'Validated',
    7: 'Confirmed',
    8: 'Authorized',
    9: 'Endorsed',
    10: 'Approved',
    11: 'Final Approval',
};

export function getBillStatusText(bill: Bill): string {
    const statusCode = bill.approvalStatus;
    return statusMap[statusCode] || 'Unknown';
}

export function getNextApprovalStatusCode(historyLength: number): number {
    // The status code is the history length + 3
    // e.g., after 0 approvals, historyLength is 0, next status is 3 (Pending Review)
    // after 1 approval, historyLength is 1, next status is 4 (Reviewed)
    return historyLength + 3;
}
