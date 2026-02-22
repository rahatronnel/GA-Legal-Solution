
import type { DemandNote } from '../components/demand-note-entry-form';
import type { ComparativeStatement } from '../components/cs-entry-form';
import type { PurchaseOrder } from '../components/po-entry-form';
import type { MRR } from '../components/mrr-entry-form';
import type { PaymentNote } from '../components/pn-entry-form';

// Status code mapping for Demand Notes, Comparative Statements, POs, MRRs and PNs
const statusMap: { [key: number]: string } = {
    0: 'Rejected',
    1: 'Completed',
    2: 'Pending Action', // For CS selection, PO/MRR first review, PN submission
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
    if(statusCode === 2) return 'Pending Vendor Selection';
    return statusMap[statusCode] || 'Unknown';
}

export function getPOStatusText(po: PurchaseOrder): string {
    if (po.isSentToVendor) {
        return 'Sent to Vendor';
    }
    const statusCode = po.approvalStatus;
    if(statusCode === undefined) return 'Unknown';
    if(statusCode === 2) return 'Pending TA Review';
    return statusMap[statusCode] || 'Unknown';
}

export function getMRRStatusText(mrr: MRR): string {
    const statusCode = mrr.approvalStatus;
    if (statusCode === undefined) return 'Unknown';
    if (statusCode === 2) return 'Pending Finalization';
    return statusMap[statusCode] || 'Unknown';
}

export function getPNStatusText(pn: PaymentNote): string {
    const statusCode = pn.approvalStatus;
    if (statusCode === undefined) return 'Unknown';
    if (statusCode === 2) return 'Awaiting Purchase Manager';
    return statusMap[statusCode] || 'Unknown';
}


export function getNextApprovalStatusCode(historyLength: number): number {
    return historyLength + 3;
}
