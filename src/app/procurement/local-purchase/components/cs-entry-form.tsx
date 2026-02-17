
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useProcurement } from './procurement-provider';
import type { DemandNote } from './demand-note-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase';

export type ComparativeStatementItem = {
    demandNoteItemId: string;
    particulars: string;
    unit: string;
    quantity: number;
    vendorQuotes: {
        vendorId: string;
        unitPrice: number;
    }[];
};

export type VendorDetail = {
    vendorId: string;
    discountType: 'Percentage' | 'Amount';
    discountValue: number;
    deliveryTerms: string;
    vatPercentage: number;
    taxPercentage: number;
    paymentTerms: string;
    warranty: string;
    sampleConfirmed: 'Yes' | 'No' | 'N/A';
};

export type ComparativeStatement = {
    id: string;
    csNumber: string;
    csDate: string;
    demandNoteId: string;
    items: ComparativeStatementItem[];
    vendorDetails: VendorDetail[];
    createdBy: string;
};

interface CsFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<ComparativeStatement>) => void;
  demandNote: DemandNote | null;
}

export function ComparativeStatementForm({ isOpen, setIsOpen, onSave, demandNote }: CsFormProps) {
    const { toast } = useToast();
    const { vendors, employees } = useProcurement();
    const { user } = useUser();
    
    const [step, setStep] = useState(0); // 0 for initial info, 1+ for vendors
    const [csData, setCsData] = useState<Partial<Omit<ComparativeStatement, 'id'>>>({});
    const [csDate, setCsDate] = useState<Date | undefined>(new Date());
    
    const assignedVendors = useMemo(() => {
        if (!demandNote?.quotations || !vendors) return [];
        return vendors.filter(v => demandNote.quotations!.some(q => q.vendorId === v.id));
    }, [demandNote, vendors]);

    const totalSteps = assignedVendors.length + 1; // +1 for the initial info step
    const progress = Math.round((step / totalSteps) * 100);

    useEffect(() => {
        if (isOpen && demandNote && user && employees && employees.length > 0) {
            const loggedInEmployee = employees.find(e => e.email === user.email);
            setStep(0);
            const initialItems: ComparativeStatementItem[] = demandNote.items.map(item => ({
                demandNoteItemId: item.id,
                particulars: item.particulars,
                unit: item.unit,
                quantity: item.requiredQty,
                vendorQuotes: assignedVendors.map(v => ({ vendorId: v.id, unitPrice: 0 })),
            }));
            
            const initialVendorDetails: VendorDetail[] = assignedVendors.map(v => ({
                vendorId: v.id,
                discountType: 'Amount',
                discountValue: 0,
                deliveryTerms: '',
                vatPercentage: 0,
                taxPercentage: 0,
                paymentTerms: '',
                warranty: '',
                sampleConfirmed: 'N/A',
            }));

            setCsData({
                demandNoteId: demandNote.id,
                csNumber: `CS-${demandNote.demandNoteNumber}`,
                csDate: new Date().toISOString(),
                items: initialItems,
                vendorDetails: initialVendorDetails,
                createdBy: loggedInEmployee?.id || '',
            });
            setCsDate(new Date());
        }
    }, [isOpen, demandNote, assignedVendors, user, employees]);
    
    const handleDateChange = (date: Date | undefined) => {
        setCsDate(date);
        setCsData(prev => ({ ...prev, csDate: date ? date.toISOString() : '' }));
    };

    const handleItemPriceChange = (itemIndex: number, vendorId: string, unitPrice: number) => {
        setCsData(prev => {
            const newItems = [...(prev.items || [])];
            const item = newItems[itemIndex];
            const quote = item.vendorQuotes.find(q => q.vendorId === vendorId);
            if (quote) {
                quote.unitPrice = unitPrice;
            }
            return { ...prev, items: newItems };
        });
    };
    
    const handleVendorDetailChange = (vendorId: string, field: keyof Omit<VendorDetail, 'vendorId'>, value: any) => {
         setCsData(prev => {
            const newDetails = [...(prev.vendorDetails || [])];
            const detail = newDetails.find(d => d.vendorId === vendorId);
            if (detail) {
                (detail as any)[field] = value;
            }
            return { ...prev, vendorDetails: newDetails };
        });
    }

    const calculateTotals = (vendorId: string) => {
        const itemTotal = csData.items?.reduce((sum, item) => {
            const quote = item.vendorQuotes.find(q => q.vendorId === vendorId);
            return sum + (item.quantity * (quote?.unitPrice || 0));
        }, 0) || 0;

        const vendorDetail = csData.vendorDetails?.find(d => d.vendorId === vendorId);
        let discount = 0;
        if (vendorDetail) {
            if (vendorDetail.discountType === 'Percentage') {
                discount = itemTotal * ((vendorDetail.discountValue || 0) / 100);
            } else {
                discount = vendorDetail.discountValue || 0;
            }
        }
        
        const subTotalAfterDiscount = itemTotal - discount;
        const vatAmount = subTotalAfterDiscount * ((vendorDetail?.vatPercentage || 0) / 100);
        const taxAmount = subTotalAfterDiscount * ((vendorDetail?.taxPercentage || 0) / 100);
        const grandTotal = subTotalAfterDiscount + vatAmount + taxAmount;

        return { itemTotal, discount, grandTotal, vatAmount, taxAmount };
    };

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps -1));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const handleSave = () => {
        onSave(csData);
        setIsOpen(false);
    };

    const currentVendor = step > 0 ? assignedVendors[step - 1] : null;
    const currentVendorDetails = currentVendor ? csData.vendorDetails?.find(d => d.vendorId === currentVendor.id) : null;
    const currentVendorTotals = currentVendor ? calculateTotals(currentVendor.id) : null;

    if (!isOpen || !demandNote) return null;

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Comparative Statement for DN: {demandNote.demandNoteNumber}</DialogTitle>
                    <DialogDescription>Enter quotation details from each vendor.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>
                <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
                    {step === 0 && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>CS Number</Label><Input value={csData.csNumber} disabled /></div>
                                <div className="space-y-2"><Label>CS Date</Label>
                                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4"/>{csDate ? format(csDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={csDate} onSelect={handleDateChange} initialFocus/></PopoverContent></Popover>
                                </div>
                                <div className="space-y-2"><Label>Demand Note Number</Label><Input value={demandNote.demandNoteNumber} disabled /></div>
                            </div>
                            <p className="text-muted-foreground">This CS will compare quotations from {assignedVendors.length} vendors. Click Next to begin.</p>
                        </div>
                    )}
                    {step > 0 && currentVendor && (
                         <div className="space-y-4">
                             <h3 className="font-semibold text-xl">Vendor: {currentVendor.vendorName}</h3>
                             <Card>
                                 <CardHeader><CardTitle>Item Pricing</CardTitle></CardHeader>
                                 <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Particulars</TableHead><TableHead>Unit</TableHead><TableHead>Qty</TableHead><TableHead className="w-48">Unit Price</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {csData.items?.map((item, index) => {
                                                const quote = item.vendorQuotes.find(q => q.vendorId === currentVendor.id);
                                                const totalPrice = item.quantity * (quote?.unitPrice || 0);
                                                return (
                                                    <TableRow key={item.demandNoteItemId}>
                                                        <TableCell>{item.particulars}</TableCell>
                                                        <TableCell>{item.unit}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell><Input type="number" value={quote?.unitPrice || ''} onChange={e => handleItemPriceChange(index, currentVendor.id, parseFloat(e.target.value) || 0)} /></TableCell>
                                                        <TableCell className="text-right">{totalPrice.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            <TableRow className="font-bold bg-muted/50">
                                                <TableCell colSpan={4} className="text-right">Subtotal</TableCell>
                                                <TableCell className="text-right">{currentVendorTotals?.itemTotal.toFixed(2)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                 </CardContent>
                             </Card>
                             <Card>
                                 <CardHeader><CardTitle>Commercial Terms & Calculation</CardTitle></CardHeader>
                                 <CardContent className="space-y-4">
                                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                        <div className="space-y-2"><Label>Discount Type</Label>
                                            <Select value={currentVendorDetails?.discountType} onValueChange={(v) => handleVendorDetailChange(currentVendor.id, 'discountType', v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Amount">Amount</SelectItem><SelectItem value="Percentage">Percentage</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Discount Value</Label><Input type="number" value={currentVendorDetails?.discountValue || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'discountValue', parseFloat(e.target.value) || 0)}/></div>
                                        <div className="space-y-2"><Label>VAT %</Label><Input type="number" value={currentVendorDetails?.vatPercentage || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'vatPercentage', parseFloat(e.target.value) || 0)}/></div>
                                        <div className="space-y-2"><Label>Tax %</Label><Input type="number" value={currentVendorDetails?.taxPercentage || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'taxPercentage', parseFloat(e.target.value) || 0)}/></div>
                                     </div>
                                      <div className="p-4 border rounded-lg bg-muted/50 mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{currentVendorTotals?.itemTotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span><span>- {currentVendorTotals?.discount.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">VAT Amount:</span><span>+ {currentVendorTotals?.vatAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Tax Amount:</span><span>+ {currentVendorTotals?.taxAmount.toFixed(2)}</span></div>
                                        <Separator />
                                        <div className="flex justify-between font-bold text-base"><span className="text-foreground">Grand Total:</span><span>{currentVendorTotals?.grandTotal.toFixed(2)}</span></div>
                                    </div>
                                      <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="space-y-2"><Label>Delivery Terms</Label><Textarea value={currentVendorDetails?.deliveryTerms} onChange={e => handleVendorDetailChange(currentVendor.id, 'deliveryTerms', e.target.value)}/></div>
                                        <div className="space-y-2"><Label>Payment Terms</Label><Textarea value={currentVendorDetails?.paymentTerms} onChange={e => handleVendorDetailChange(currentVendor.id, 'paymentTerms', e.target.value)}/></div>
                                        <div className="space-y-2"><Label>Warranty</Label><Textarea value={currentVendorDetails?.warranty} onChange={e => handleVendorDetailChange(currentVendor.id, 'warranty', e.target.value)}/></div>
                                        <div className="space-y-2"><Label>Quality/Sample Confirmation</Label>
                                            <Select value={currentVendorDetails?.sampleConfirmed} onValueChange={(v) => handleVendorDetailChange(currentVendor.id, 'sampleConfirmed', v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                      </div>
                                 </CardContent>
                             </Card>
                         </div>
                    )}
                </div>
                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <div>
                        {step > 0 && (<Button variant="outline" onClick={prevStep}><ChevronsLeft className="mr-2 h-4 w-4" /> Previous</Button>)}
                    </div>
                    <div>
                        {step < totalSteps - 1 ? (
                            <Button onClick={nextStep}>Next <ChevronsRight className="ml-2 h-4 w-4" /></Button>
                        ) : (
                            <Button onClick={handleSave}>Save Comparative Statement</Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
