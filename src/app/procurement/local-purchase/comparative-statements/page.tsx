'use client';
import { ComparativeStatementTable } from '../components/cs-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function CsApprovalInfo() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5 text-yellow-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>CS Approval Workflow Explained</DialogTitle>
                    <DialogDescription>
                        The approval process for a Comparative Statement (CS) is determined by its financial value.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-4 py-4">
                    <p>
                        First, the system calculates an "Approval Amount" based on the setting you configured in the settings tab (Minimum, Average, or Maximum of all vendor quotes).
                    </p>
                    <p>
                        Based on this amount, the following approval chain is automatically applied:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong className="text-foreground">Up to 9,999:</strong> A single approval from the <strong className="text-foreground">Purchase Manager</strong> is required.
                        </li>
                        <li>
                            <strong className="text-foreground">From 10,000 to 99,999:</strong> A 2-step approval is needed from the <strong className="text-foreground">Purchase Manager</strong> and then the <strong className="text-foreground">Purchase Department TA</strong>.
                        </li>
                        <li>
                            <strong className="text-foreground">From 100,000 to 999,999:</strong> A 4-step approval is needed, adding the <strong className="text-foreground">Requester's Department TA</strong> and the <strong className="text-foreground">Specialized Dept. Manager</strong> to the previous chain.
                        </li>
                         <li>
                            <strong className="text-foreground">Above 1,000,000:</strong> The full 9-step approval is required, involving all configured roles up to the <strong className="text-foreground">Managing Director</strong> or <strong className="text-foreground">Factory Director</strong> for the final sign-off.
                        </li>
                    </ul>
                     <p>
                        The CS will move from one approver to the next in sequence. The process is complete only when the final person in the chain gives their approval.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function ComparativeStatementsPage() {
    return (
        <Card>
            <CardHeader className="items-center text-center">
                <CsApprovalInfo />
                <CardTitle>Comparative Statements</CardTitle>
                <CardDescription>Review and manage all generated comparative statements.</CardDescription>
            </CardHeader>
            <CardContent>
                <ComparativeStatementTable />
            </CardContent>
        </Card>
    );
}
