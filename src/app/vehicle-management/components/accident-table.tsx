
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export function AccidentTable() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Accident Record
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Accident Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No accident records found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
       <p className="text-center text-sm text-muted-foreground pt-4">
            Full functionality for Accident Management is coming soon.
        </p>
    </div>
  );
}
