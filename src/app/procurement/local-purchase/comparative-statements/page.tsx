'use client';
import { ComparativeStatementTable } from '../components/cs-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ComparativeStatementsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Comparative Statements</CardTitle>
                <CardDescription>Review and manage all generated comparative statements.</CardDescription>
            </CardHeader>
            <CardContent>
                <ComparativeStatementTable />
            </CardContent>
        </Card>
    );
}
