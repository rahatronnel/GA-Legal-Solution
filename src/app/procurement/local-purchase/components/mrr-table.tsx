
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
import { Search, Eye, Trash2, Copy, FileText, PackageCheck, Calendar, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { MRR } from './mrr-entry-form';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold"><FileText className="h-4 w-4 inline mr-2" />MRR Number</TableHead>
                                <TableHead className="font-bold"><Calendar className="h-4 w-4 inline mr-2" />Receiving Date</TableHead>
                                <TableHead className="font-bold"><Truck className="h-4 w-4 inline mr-2" />Supplier</TableHead>
                                <TableHead className="font-bold"><FileText className="h-4 w-4 inline mr-2" />Demand Note</TableHead>
                                <TableHead className="font-bold"><CheckCircle2 className="h-4 w-4 inline mr-2" />Condition</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading Material Receiving Reports...</TableCell></TableRow>
                            ) : filteredMrrs.length > 0 ? (
                                filteredMrrs.map(mrr => (
                                    <TableRow key={mrr.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-primary">{mrr.mrrNumber}</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(mrr.mrrNumber); toast({ title: 'Copied!' }); }}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy MRR#</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{mrr.receivingDate}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{mrr.supplierName}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{mrr.supplierAddress}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">{mrr.demandNoteNumber}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={mrr.goodsCondition === 'Ok' ? 'default' : 'destructive'}
                                                className={cn("flex items-center w-fit gap-1", mrr.goodsCondition === 'Ok' ? "bg-green-600 hover:bg-green-700" : "")}
                                            >
                                                {mrr.goodsCondition === 'Ok' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                {mrr.goodsCondition}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View Details</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" onClick={() => handleDelete(mrr.id)} /></Button></TooltipTrigger><TooltipContent>Delete Report</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No Material Receiving Reports found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}
