
import type { DemandNote } from '../components/demand-note-entry-form';
import type { ComparativeStatement } from '../components/cs-entry-form';

// Status code mapping for Demand Notes and Comparative Statements
const statusMap: { [key: number]: string } = {
    0: 'Rejected',
    1: 'Completed',
    2: 'Pending Vendor Selection',
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

export function getDemandNoteStatusText(note: DemandNote): string {
    const statusCode = note.approvalStatus;
    if(statusCode === undefined) return 'Unknown';
    return statusMap[statusCode] || 'Unknown';
}

export function getCSStatusText(cs: ComparativeStatement): string {
    const statusCode = cs.approvalStatus;
    if(statusCode === undefined) return 'Unknown';
    return statusMap[statusCode] || 'Unknown';
}


export function getNextApprovalStatusCode(historyLength: number): number {
    return historyLength + 3;
}
