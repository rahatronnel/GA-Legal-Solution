
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronsRight, ChevronsLeft, Hash, Info, User, Tag, MapPin, DollarSign, Clock, CheckCircle2, Upload, FileText, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl, FIRESTORE_MAX_FILE_SIZE } from '@/lib/utils';
import { format } from 'date-fns';
import { useProcurement } from './procurement-provider';
import type { DemandNote, Quotation } from './demand-note-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

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
    selectedVendorId?: string;
    vendorSelectorId?: string;
    vendorSelectionDate?: string;
    items: ComparativeStatementItem[];
    vendorDetails: VendorDetail[];
    createdBy: string;
    approvalAmount?: number;
    approvalAmountBasis?: 'Minimum' | 'Average' | 'Maximum';
    approvalFlow?: {
        steps: { stepName: string; approverId: string; }[];
    };
    approvalStatus?: number;
    currentApproverId?: string;
    approvalHistory?: any[];
};

interface CsFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: any) => void;
  demandNote: DemandNote | null;
}

export function ComparativeStatementForm({ isOpen, setIsOpen, onSave, demandNote }: CsFormProps) {
    const { toast } = useToast();
    const { vendors, employees, orgSettings } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [step, setStep] = useState(0); 
    const [csData, setCsData] = useState<Partial<Omit<ComparativeStatement, 'id'>>>({});
    const [csDate, setCsDate] = useState<Date | undefined>(new Date());
    const [newQuotations, setNewQuotations] = useState<Record<string, { fileName: string; fileDataUrl: string }>>({});
    
    const assignedVendors = useMemo(() => {
        if (!demandNote?.quotations || !vendors) return [];
        return vendors.filter(v => demandNote.quotations!.some(q => q.vendorId === v.id));
    }, [demandNote, vendors]);

    const totalSteps = assignedVendors.length + 1; 
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
            setNewQuotations({});
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

    const handleQuotationUpload = async (e: React.ChangeEvent<HTMLInputElement>, vendorId: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (file.size > FIRESTORE_MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `This file exceeds the limit (~750KB). Please optimize the document.`
                });
                return;
            }

            try {
                const dataUrl = await imageToDataUrl(file);
                setNewQuotations(prev => ({
                    ...prev,
                    [vendorId]: { fileName: file.name, fileDataUrl: dataUrl }
                }));
                toast({ title: "Quotation Linked", description: `${file.name} is ready for processing.` });
            } catch (err) {
                toast({ variant: 'destructive', title: 'Upload error' });
            }
        }
    };

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

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const handleSave = () => {
        if (!demandNote || !firestore) return;
    
        const dataToSave: any = { ...csData };
    
        if (!orgSettings) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load organization settings.' });
            return;
        }
    
        // Informed Synchronization: Update Demand Note quotations with new files
        const updatedQuotations = (demandNote.quotations || []).map(q => {
            if (newQuotations[q.vendorId]) {
                return { ...q, ...newQuotations[q.vendorId] };
            }
            return q;
        });

        const noteRef = doc(firestore, 'demandNotes', demandNote.id);
        setDocumentNonBlocking(noteRef, { quotations: updatedQuotations }, { merge: true });

        const { procurementSettings } = orgSettings;
        const { csApprovalRoles, departmentHeads, specializedDeptManagerId, managingDirectorId, factoryDirectorId } = procurementSettings || {};
        
        const vendorTotals = (csData.vendorDetails || []).map(vd => calculateTotals(vd.vendorId).grandTotal);
        let approvalAmount = 0;
        const basis = csApprovalRoles?.approvalAmountBasis || 'Minimum';

        if (vendorTotals.length > 0) {
            if (basis === 'Minimum') approvalAmount = Math.min(...vendorTotals);
            else if (basis === 'Maximum') approvalAmount = Math.max(...vendorTotals);
            else approvalAmount = vendorTotals.reduce((sum, total) => sum + total, 0) / vendorTotals.length;
        }
        
        dataToSave.approvalAmount = approvalAmount;
        dataToSave.approvalAmountBasis = basis as any;
    
        const approvalSteps: {stepName: string, approverId: string}[] = [];
        const roles = csApprovalRoles;
        const requesterDeptTA = (departmentHeads || []).find(dh => dh.sectionId === demandNote.sectionId)?.technicalAdvisorId;
    
        if (approvalAmount <= 9999) {
            if (roles?.purchaseManagerId) approvalSteps.push({ stepName: 'Purchase Manager', approverId: roles.purchaseManagerId });
        } else if (approvalAmount <= 99999) {
            if (roles?.purchaseManagerId) approvalSteps.push({ stepName: 'Purchase Manager', approverId: roles.purchaseManagerId });
            if (roles?.purchaseDeptTaId) approvalSteps.push({ stepName: 'Purchase Department TA', approverId: roles.purchaseDeptTaId });
        } else if (approvalAmount <= 999999) {
            if (roles?.purchaseManagerId) approvalSteps.push({ stepName: 'Purchase Manager', approverId: roles.purchaseManagerId });
            if (roles?.purchaseDeptTaId) approvalSteps.push({ stepName: 'Purchase Department TA', approverId: roles.purchaseDeptTaId });
            if (requesterDeptTA) approvalSteps.push({ stepName: "Requester Dept. TA", approverId: requesterDeptTA });
            if (specializedDeptManagerId) approvalSteps.push({ stepName: "Specialized Dept. Manager", approverId: specializedDeptManagerId });
        } else {
            if (roles?.purchaseManagerId) approvalSteps.push({ stepName: 'Purchase Manager', approverId: roles.purchaseManagerId });
            if (roles?.purchaseDeptTaId) approvalSteps.push({ stepName: 'Purchase Department TA', approverId: roles.purchaseDeptTaId });
            if (requesterDeptTA) approvalSteps.push({ stepName: "Requester Dept. TA", approverId: requesterDeptTA });
            if (specializedDeptManagerId) approvalSteps.push({ stepName: "Specialized Dept. Manager", approverId: specializedDeptManagerId });
            if (roles?.viceFactoryManagerId) approvalSteps.push({ stepName: "Vice Factory Manager", approverId: roles.viceFactoryManagerId });
            if (roles?.accountsManagerId) approvalSteps.push({ stepName: "Accounts Manager", approverId: roles.accountsManagerId });
            if (roles?.gmSalesDeptId) approvalSteps.push({ stepName: "GM Sales Department", approverId: roles.gmSalesDeptId });
            if (roles?.gmAdministrationId) approvalSteps.push({ stepName: "GM-Administration", approverId: roles.gmAdministrationId });
            if (managingDirectorId || factoryDirectorId) {
                approvalSteps.push({ stepName: "Final Approval (MD/FD)", approverId: managingDirectorId || factoryDirectorId! });
            }
        }
        
        dataToSave.approvalFlow = { steps: approvalSteps };
        dataToSave.approvalStatus = 2; 
        dataToSave.currentApproverId = '';
        dataToSave.vendorSelectorId = dataToSave.createdBy;
        dataToSave.approvalHistory = [];
        
        onSave(dataToSave);
        setIsOpen(false);
    };

    const currentVendor = step > 0 ? assignedVendors[step - 1] : null;
    const currentVendorDetails = currentVendor ? csData.vendorDetails?.find(d => d.vendorId === currentVendor.id) : null;
    const currentVendorTotals = currentVendor ? calculateTotals(currentVendor.id) : null;
    const currentQuotation = currentVendor ? (newQuotations[currentVendor.id] || demandNote?.quotations?.find(q => q.vendorId === currentVendor.id)) : null;

    if (!isOpen || !demandNote) return null;

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-6xl h-[90vh] flex flex-col animate-dialog-in">
                <DialogHeader>
                    <DialogTitle>Comparative Statement for DN: {demandNote.demandNoteNumber}</DialogTitle>
                    <DialogDescription>Enter quotation details and upload vendor bids for micro-level comparison.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>
                <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
                    {step === 0 && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Hash className="h-4 w-4" /> CS Number</Label>
                                    <Input value={csData.csNumber || ''} disabled className="bg-muted/50 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> CS Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className="w-full justify-start text-left font-normal animate-scale-in"><CalendarIcon className="mr-2 h-4 w-4"/>{csDate ? format(csDate, "PPP") : <span>Pick a date</span>}</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 animate-scale-in"><Calendar mode="single" selected={csDate} onSelect={handleDateChange} initialFocus/></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Hash className="h-4 w-4" /> Demand Note Number</Label>
                                    <Input value={demandNote.demandNoteNumber || ''} disabled className="bg-muted/50" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg bg-primary/5 flex items-center gap-3">
                                <Info className="h-5 w-5 text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">This CS will compare quotations from <strong>{assignedVendors.length} vendors</strong>. Click Next to begin entering the data for each vendor.</p>
                            </div>
                        </div>
                    )}
                    {step > 0 && currentVendor && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="flex justify-between items-center p-3 bg-muted rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary text-primary-foreground rounded-md"><User className="h-5 w-5" /></div>
                                    <h3 className="font-bold text-xl">Vendor: {currentVendor.vendorName}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentQuotation?.fileDataUrl ? (
                                        <div className="flex items-center gap-2 bg-background p-1.5 rounded-md border text-xs shadow-sm">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="max-w-[150px] truncate font-semibold">{currentQuotation.fileName}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setNewQuotations(p => { const n = {...p}; delete n[currentVendor.id]; return n; })}><X className="h-3 w-3" /></Button>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="text-destructive border-destructive">No Quotation Uploaded</Badge>
                                    )}
                                    <Label htmlFor={`cs-up-${currentVendor.id}`} className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 transition-colors">
                                            <Upload className="h-3 w-3" /> {currentQuotation?.fileDataUrl ? 'Replace Quote' : 'Upload Quote'}
                                        </div>
                                        <Input id={`cs-up-${currentVendor.id}`} type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleQuotationUpload(e, currentVendor.id)} />
                                    </Label>
                                </div>
                             </div>
                             
                             <Card className="shadow-sm border-primary/10">
                                 <CardHeader className="py-3 border-b bg-muted/20"><CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wider"><Tag className="h-4 w-4" /> Item Pricing</CardTitle></CardHeader>
                                 <CardContent className="pt-4">
                                    <Table>
                                        <TableHeader><TableRow className="bg-muted/50"><TableHead>Particulars</TableHead><TableHead>Unit</TableHead><TableHead>Qty</TableHead><TableHead className="w-48">Unit Price</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {csData.items?.map((item, index) => {
                                                const quote = item.vendorQuotes.find(q => q.vendorId === currentVendor.id);
                                                const totalPrice = item.quantity * (quote?.unitPrice || 0);
                                                return (
                                                    <TableRow key={item.demandNoteItemId} className="hover:bg-muted/30">
                                                        <TableCell className="font-medium">{item.particulars}</TableCell>
                                                        <TableCell>{item.unit}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell><Input type="number" value={quote?.unitPrice ?? ''} onChange={e => handleItemPriceChange(index, currentVendor.id, parseFloat(e.target.value) || 0)} className="h-8" /></TableCell>
                                                        <TableCell className="text-right font-bold">{totalPrice.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            <TableRow className="font-bold bg-muted/50 border-t-2">
                                                <TableCell colSpan={4} className="text-right uppercase">Subtotal Item Cost</TableCell>
                                                <TableCell className="text-right text-lg">{currentVendorTotals?.itemTotal.toFixed(2)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                 </CardContent>
                             </Card>

                             <Card className="shadow-sm border-primary/10">
                                 <CardHeader className="py-3 border-b bg-muted/20"><CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wider"><DollarSign className="h-4 w-4" /> Commercial Terms & Calculations</CardTitle></CardHeader>
                                 <CardContent className="pt-4 space-y-6">
                                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-xs"><Tag className="h-3 w-3" /> Discount Type</Label>
                                            <Select value={currentVendorDetails?.discountType || 'Amount'} onValueChange={(v) => handleVendorDetailChange(currentVendor.id, 'discountType', v as any)}>
                                                <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Amount">Amount</SelectItem><SelectItem value="Percentage">Percentage</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-xs"><DollarSign className="h-3 w-3" /> Discount Value</Label>
                                            <Input type="number" value={currentVendorDetails?.discountValue ?? ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'discountValue', parseFloat(e.target.value) || 0)} className="h-9"/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-xs"><Tag className="h-3 w-3" /> VAT %</Label>
                                            <Input type="number" value={currentVendorDetails?.vatPercentage ?? ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'vatPercentage', parseFloat(e.target.value) || 0)} className="h-9"/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-xs"><Tag className="h-3 w-3" /> Tax %</Label>
                                            <Input type="number" value={currentVendorDetails?.taxPercentage ?? ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'taxPercentage', parseFloat(e.target.value) || 0)} className="h-9"/>
                                        </div>
                                     </div>

                                      <div className="p-4 border rounded-lg bg-muted/50 space-y-2 text-sm">
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Subtotal:</span><span>{currentVendorTotals?.itemTotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-medium text-red-500"><span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Discount:</span><span>- {currentVendorTotals?.discount.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> VAT Amount:</span><span>+ {currentVendorTotals?.vatAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> Tax Amount:</span><span>+ {currentVendorTotals?.taxAmount.toFixed(2)}</span></div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between font-black text-xl"><span className="text-foreground uppercase tracking-tight flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-primary" /> Grand Total:</span><span className="text-primary">{currentVendorTotals?.grandTotal.toFixed(2)}</span></div>
                                    </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2"><Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Terms</Label><Textarea value={currentVendorDetails?.deliveryTerms || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'deliveryTerms', e.target.value)} rows={3} className="text-sm" /></div>
                                        <div className="space-y-2"><Label className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Payment Terms</Label><Textarea value={currentVendorDetails?.paymentTerms || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'paymentTerms', e.target.value)} rows={3} className="text-sm" /></div>
                                        <div className="space-y-2"><Label className="flex items-center gap-2"><Info className="h-4 w-4" /> Warranty</Label><Textarea value={currentVendorDetails?.warranty || ''} onChange={e => handleVendorDetailChange(currentVendor.id, 'warranty', e.target.value)} rows={3} className="text-sm" /></div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Quality / Sample Confirmation</Label>
                                            <Select value={currentVendorDetails?.sampleConfirmed || 'N/A'} onValueChange={(v) => handleVendorDetailChange(currentVendor.id, 'sampleConfirmed', v as any)}>
                                                <SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
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
                        {step > 0 && (<Button variant="outline" onClick={prevStep}><ChevronsLeft className="mr-2 h-4 w-4" /> Previous Vendor</Button>)}
                    </div>
                    <div>
                        {step < totalSteps - 1 ? (
                            <Button onClick={nextStep}>Next Vendor <ChevronsRight className="ml-2 h-4 w-4" /></Button>
                        ) : (
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20">Save Comparative Statement</Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
