
import type { Bill } from '../components/bill-entry-form';
import type { ApprovalRule } from '../components/approval-config-table';
import { isAfter, isToday } from 'date-fns';

/**
 * Finds the matching approval rule for a given bill amount.
 * @param amount The total payable amount of the bill.
 * @param rules An array of all available approval rules.
 * @returns The matching ApprovalRule or null if no match is found.
 */
function findMatchingRule(amount: number, rules: ApprovalRule[]): ApprovalRule | null {
    const now = new Date();
    const activeRules = rules.filter(rule => {
        if (!rule.effectiveDate) return true; // Rules without a date are always active
        const effectiveDate = new Date(rule.effectiveDate);
        return isToday(effectiveDate) || isAfter(now, effectiveDate);
    });

    const matchingRule = activeRules.find(rule => amount >= rule.minAmount && amount <= rule.maxAmount);
    return matchingRule || null;
}

/**
 * Determines the next approver for a bill based on its history and the matched rule.
 * @param bill The bill to process.
 * @param rule The approval rule that applies to this bill.
 * @returns The ID of the next approver, or an empty string if fully approved or no rule matches.
 */
function getNextApprover(bill: Bill, rule: ApprovalRule | null): string {
    if (!rule || bill.approvalStatus === 'Approved' || bill.approvalStatus === 'Rejected') {
        return '';
    }

    const currentApprovalLevel = bill.approvalHistory?.filter(h => h.status === 'Approved').length || 0;
    const nextLevel = currentApprovalLevel + 1;

    const nextApproverLevel = rule.approverLevels.find(level => level.level === nextLevel);

    return nextApproverLevel?.approverId || ''; // Return approver ID or empty string if fully approved
}


/**
 * Processes a bill to determine its next approver based on the defined approval rules.
 * @param bill The bill to be processed.
 * @param rules The list of all approval rules.
 * @returns The bill object with the `currentApproverId` updated.
 */
export function processBill(bill: Bill, rules: ApprovalRule[]): Bill {
    const matchingRule = findMatchingRule(bill.totalPayableAmount, rules);
    const nextApproverId = getNextApprover(bill, matchingRule);

    return {
        ...bill,
        currentApproverId: nextApproverId,
    };
}

    