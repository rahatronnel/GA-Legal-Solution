
import type { Bill } from '../components/bill-entry-form';

type ApprovalStep = {
    stepName: string;
    approverId: string;
    statusName: string;
};

type ApprovalFlow = {
    effectiveDate: string;
    steps: ApprovalStep[];
};

export const defaultStepAndStatusNames: { [key: number]: { steps: Omit<ApprovalStep, 'approverId'>[] } } = {
    1: { steps: [{ stepName: 'Approver', statusName: 'Approved' }] },
    2: { steps: [{ stepName: 'Initiator', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    3: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Reviewer', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    4: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    5: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Compliance Officer', statusName: 'Validated' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    6: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    7: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    8: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Financial Reviewer', statusName: 'Endorsed' }, { stepName: 'Final Approver', statusName: 'Approved' }] },
    9: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Financial Reviewer', statusName: 'Endorsed' }, { stepName: 'Senior Reviewer', statusName: 'Approved' }, { stepName: 'Final Approver', statusName: 'Final Approval' }] },
    10: { steps: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Reviewed' }, { stepName: 'Pre-Approval Officer', statusName: 'Checked' }, { stepName: 'Compliance Officer', statusName: 'Validated' }, { stepName: 'Department Head', statusName: 'Confirmed' }, { stepName: 'Financial Reviewer', statusName: 'Authorized' }, { stepName: 'Senior Reviewer', statusName: 'Endorsed' }, { stepName: 'Executive Approver', statusName: 'Approved' }, { stepName: 'Final Approver', statusName: 'Completed' }] },
};


export function getBillStatusText(bill: Bill, approvalFlow?: ApprovalFlow): string {
    if (!approvalFlow || !approvalFlow.steps || approvalFlow.steps.length === 0) {
        if (bill.approvalStatus === 1) return 'Approved';
        if (bill.approvalStatus === 0) return 'Rejected';
        return 'Pending';
    }

    if (bill.approvalStatus === 0) {
        return 'Rejected';
    }
    
    const historyLength = bill.approvalHistory?.length || 0;

    if (bill.approvalStatus === 1) {
        // If approved, use the status name of the final step
        return approvalFlow.steps[approvalFlow.steps.length - 1].statusName;
    }

    if (bill.approvalStatus === 2) {
        if (historyLength === 0) {
            // It's pending the first approver
            return 'Pending';
        }
        if (historyLength < approvalFlow.steps.length) {
            // It has been approved by some, and is pending the next step.
            // The status should reflect what has just been completed.
            return approvalFlow.steps[historyLength - 1].statusName;
        }
    }
    
    return 'Pending';
}
