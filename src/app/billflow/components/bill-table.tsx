
"use client";

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BillTable() {
  const { toast } = useToast();

  const handleAdd = () => {
    toast({
        title: "Coming Soon!",
        description: "The multi-step bill entry form is the next feature to be built."
    });
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Bill</Button>
        </div>
         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No bills found. Click "Add Bill" to start.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
