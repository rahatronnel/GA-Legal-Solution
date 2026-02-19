
"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Trash2, Copy, FileText, PackageCheck } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { MRR } from './mrr-entry-form';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MRRTable() {
    const { mrrs, isLoading } = useProcurement();
    const { toast } = useToast();
    const firestore = useFirestore();
    const mrrColRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredMrrs = useMemo(() => {
        const safeItems = Array.isArray(mrrs) ? mrrs : [];
        return safeItems.filter(mrr => {
            const lowerTerm = searchTerm.toLowerCase();
            return !searchTerm || 
                mrr.mrrNumber.toLowerCase().includes(lowerTerm) || 
                mrr.supplierName.toLowerCase().includes(lowerTerm) ||
                mrr.demandNoteNumber.toLowerCase().includes(lowerTerm);
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [mrrs, searchTerm]);

    const handleDelete = (id: string) => {
        if (!mrrColRef) return;
        deleteDocumentNonBlocking(doc(mrrColRef, id));
        toast({ title: 'Deleted', description: 'MRR has been removed.' });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search MRR#, Supplier, DN#..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-8" 
                    />
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>MRR Number</TableHead>
                                <TableHead>Receiving Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>Goods Condition</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredMrrs.length > 0 ? (
                                filteredMrrs.map(mrr => (
                                    <TableRow key={mrr.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{mrr.mrrNumber}</span>
                                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(mrr.mrrNumber); toast({ title: 'Copied!' }); }}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{mrr.receivingDate}</TableCell>
                                        <TableCell>{mrr.supplierName}</TableCell>
                                        <TableCell>{mrr.demandNoteNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={mrr.goodsCondition === 'Ok' ? 'default' : 'destructive'}>
                                                {mrr.goodsCondition}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View Details</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(mrr.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Report</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No Material Receiving Reports found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}
