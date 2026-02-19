
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, User, Building, Info, Hash, Phone, Mail, MapPin, Truck, ListOrdered, DollarSign, Tag, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useProcurement } from './procurement-provider';
import type { ComparativeStatement } from './cs-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type UploadedFile = {
  id: string;
  name: string;
  file: string; // data URL
}

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  poDate: string;
  demandNoteId: string;
  csId: string;
  vendorId: string;
  items: {
    demandNoteItemId: string;
    particulars: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  discountAmount?: number;
  vatAmount?: number;
  taxAmount?: number;
  netPayableAmount: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  warranty?: string;
  expectedDeliveryDate?: string;
  status: 'Pending' | 'Partially Delivered' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
  comments?: string;
  confirmedBySupplier?: boolean;
  mandatoryTerms?: string;
  otherTerms?: string;

  // Sending tracking
  isSentToVendor?: boolean;
  sentToVendorDate?: string;

  documents?: {
    poAcknowledgement: UploadedFile[];
    invoice: UploadedFile[];
    mushok: UploadedFile[];
    challan: UploadedFile[];
  };

  approvalFlow?: {
      steps: { stepName: string; approverId: string; }[];
  };
  approvalStatus: number;
  currentApproverId: string;
  approvalHistory: {
      level: number;
      approverId: string;
      status: 'Approved' | 'Rejected';
      timestamp: string;
      remarks: string;
  }[];
};

interface POFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<PurchaseOrder>) => void;
  cs: ComparativeStatement | null;
}

export function PurchaseOrderForm({ isOpen, setIsOpen, onSave, cs }: POFormProps) {
  const { vendors, demandNotes, orgSettings, employees } = useProcurement();
  const { user } = useUser();
  const [poData, setPoData] = useState<Partial<PurchaseOrder>>({});
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>();

  const demandNote = useMemo(() => {
    if (!cs || !demandNotes) return null;
    return demandNotes.find(dn => dn.id === cs.demandNoteId);
  }, [cs, demandNotes]);

  const vendor = useMemo(() => {
    if (!cs || !vendors) return null;
    return vendors.find(v => v.id === cs.selectedVendorId);
  }, [cs, vendors]);

  const contactPerson = useMemo(() => {
    if (!demandNote || !employees) return null;
    return employees.find(e => e.id === demandNote.createdBy);
  }, [demandNote, employees]);

  useEffect(() => {
    if (isOpen && cs && vendor && demandNote && orgSettings && user) {
      const loggedInUser = (employees || []).find(e => e.email === user.email);
      
      const poItems = cs.items.map(item => {
        const quote = item.vendorQuotes.find(q => q.vendorId === cs.selectedVendorId);
        const unitPrice = quote?.unitPrice || 0;
        return {
          demandNoteItemId: item.demandNoteItemId,
          particulars: item.particulars,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: item.quantity * unitPrice,
        };
      });

      const totalAmount = poItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const selectedVendorDetails = cs.vendorDetails.find(vd => vd.vendorId === cs.selectedVendorId);
      
      let discountAmount = 0;
      if (selectedVendorDetails) {
        if (selectedVendorDetails.discountType === 'Percentage') {
            discountAmount = totalAmount * ((selectedVendorDetails.discountValue || 0) / 100);
        } else {
            discountAmount = selectedVendorDetails.discountValue || 0;
        }
      }
      
      const subtotalAfterDiscount = totalAmount - discountAmount;
      const vatAmount = subtotalAfterDiscount * ((selectedVendorDetails?.vatPercentage || 0) / 100);
      const taxAmount = subtotalAfterDiscount * ((selectedVendorDetails?.taxPercentage || 0) / 100);
      const netPayableAmount = subtotalAfterDiscount + vatAmount + taxAmount;

      const { csApprovalRoles } = orgSettings.procurementSettings || {};
      const approvalSteps = [];
      
      if (csApprovalRoles?.purchaseDeptTaId) {
          approvalSteps.push({ stepName: 'Purchase Department TA', approverId: csApprovalRoles.purchaseDeptTaId });
      }
      
      if (csApprovalRoles?.purchaseManagerId) {
          approvalSteps.push({ stepName: 'Purchase Manager', approverId: csApprovalRoles.purchaseManagerId });
      }

      setPoData({
        poNumber: `PO-${cs.csNumber}` || '',
        poDate: format(new Date(), 'yyyy-MM-dd') || '',
        demandNoteId: cs.demandNoteId || '',
        csId: cs.id || '',
        vendorId: cs.selectedVendorId || '',
        items: poItems || [],
        totalAmount,
        discountAmount,
        vatAmount,
        taxAmount,
        netPayableAmount,
        deliveryTerms: selectedVendorDetails?.deliveryTerms || '',
        paymentTerms: selectedVendorDetails?.paymentTerms || '',
        warranty: selectedVendorDetails?.warranty || '',
        status: 'Pending',
        createdBy: loggedInUser?.id || '',
        createdAt: new Date().toISOString(),
        mandatoryTerms: orgSettings.procurementSettings?.poSettings?.mandatoryTerms || '',
        otherTerms: orgSettings.procurementSettings?.poSettings?.otherTerms || '',
        comments: '',
        isSentToVendor: false,
        documents: {
          poAcknowledgement: [],
          invoice: [],
          mushok: [],
          challan: []
        },
        approvalFlow: { steps: approvalSteps },
        approvalStatus: 2, 
        currentApproverId: approvalSteps[0]?.approverId || '',
        approvalHistory: [],
      });
      setExpectedDeliveryDate(undefined);
    }
  }, [isOpen, cs, vendor, demandNote, orgSettings, user, employees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setPoData(prev => ({...prev, [id]: value }));
  }

  const handleDateChange = (date: Date | undefined) => {
    setExpectedDeliveryDate(date);
    setPoData(prev => ({ ...prev, expectedDeliveryDate: date ? format(date, 'yyyy-MM-dd') : '' }));
  }
  
  const handleCheckboxChange = (checked: boolean) => {
      setPoData(prev => ({ ...prev, confirmedBySupplier: checked }));
  }

  const handleSave = () => {
    onSave(poData);
    setIsOpen(false);
  }

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><ClipboardCheck className="h-6 w-6" /></div>
            <div>
                <DialogTitle className="text-2xl">Prepare Purchase Order</DialogTitle>
                <DialogDescription>Review the details and finalize the PO for CS: <span className="font-bold text-foreground">{cs?.csNumber}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs"><Hash className="h-3 w-3" /> PO Number</Label>
                <Input value={poData.poNumber || ''} disabled className="bg-muted/50 font-bold" />
            </div>
            <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs"><CalendarIcon className="h-3 w-3" /> PO Date</Label>
                <Input value={poData.poDate || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs"><User className="h-3 w-3" /> DN Contact Person</Label>
                <Input value={contactPerson?.fullName || ''} disabled className="bg-muted/50" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="py-2 border-b"><CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wider"><Building className="h-4 w-4" /> Supplier Details</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2 pt-3">
                    <p className="font-bold text-base">{vendor?.vendorName || ''}</p>
                    <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 flex-shrink-0" /> {vendor?.officeAddress || ''}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {vendor?.mobileNumber || ''}</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {vendor?.email || ''}</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-primary/10">
                <CardHeader className="py-2 border-b"><CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wider"><MapPin className="h-4 w-4" /> Delivery Location</CardTitle></CardHeader>
                <CardContent className="text-sm pt-3">
                    <p className="font-semibold text-base">{demandNote?.deliveryPlace || ''}</p>
                    <p className="text-muted-foreground italic text-xs mt-1">As specified in the original demand note.</p>
                </CardContent>
              </Card>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-bold uppercase tracking-tight text-xs"><ListOrdered className="h-4 w-4" /> Ordered Items</Label>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50"><TableRow><TableHead className="w-12">SL</TableHead><TableHead>Particulars</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {(poData.items || []).map((item, index) => (
                            <TableRow key={item.demandNoteItemId}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{item.particulars}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell><Badge variant="outline">{item.unit}</Badge></TableCell>
                                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(item.totalPrice)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>

          <div className="flex justify-end">
             <div className="w-full max-w-sm space-y-2 text-sm p-4 bg-muted/30 rounded-lg border">
                <div className="flex justify-between font-medium"><span className="text-muted-foreground">Subtotal Amount:</span><span>{formatCurrency(poData.totalAmount)}</span></div>
                <div className="flex justify-between font-medium text-red-500"><span>Applied Discount:</span><span>- {formatCurrency(poData.discountAmount)}</span></div>
                <div className="flex justify-between font-medium"><span className="text-muted-foreground">VAT Amount:</span><span>+ {formatCurrency(poData.vatAmount)}</span></div>
                <div className="flex justify-between font-medium"><span className="text-muted-foreground">Tax Amount:</span><span>+ {formatCurrency(poData.taxAmount)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-black text-xl"><span className="text-foreground uppercase tracking-tighter">Grand Total:</span><span className="text-primary">{formatCurrency(poData.netPayableAmount)}</span></div>
            </div>
          </div>
          
           <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Expected Delivery Date</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4"/>{expectedDeliveryDate ? format(expectedDeliveryDate, 'PPP') : 'Pick a date'}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expectedDeliveryDate} onSelect={handleDateChange} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments / Special Instructions</Label>
                        <Textarea id="comments" value={poData.comments || ''} onChange={handleInputChange} rows={4} placeholder="Type any internal notes or instructions for the supplier..."/>
                    </div>
                     <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border border-dashed">
                        <input type="checkbox" id="confirmedBySupplier" checked={!!poData.confirmedBySupplier} onChange={e => handleCheckboxChange(e.target.checked)} className="form-checkbox h-5 w-5 text-primary rounded transition-all cursor-pointer" />
                        <Label htmlFor="confirmedBySupplier" className="font-bold cursor-pointer">Confirmed by Supplier verbally/initially</Label>
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Delivery Terms</Label>
                        <Textarea value={poData.deliveryTerms || ''} readOnly className="bg-muted/30 text-xs italic" rows={2}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold"><DollarSign className="h-4 w-4" /> Payment Terms</Label>
                        <Textarea value={poData.paymentTerms || ''} readOnly className="bg-muted/30 text-xs italic" rows={2}/>
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4" /> Warranty Information</Label>
                        <Textarea value={poData.warranty || ''} readOnly className="bg-muted/30 text-xs italic" rows={2}/>
                    </div>
                </div>
           </div>
            <Separator/>
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="font-bold text-lg flex items-center gap-2 text-primary"><ClipboardCheck className="h-5 w-5" /> Mandatory Terms & Conditions</Label>
                    <div className="p-4 bg-muted/20 border rounded-lg whitespace-pre-wrap text-sm opacity-80 leading-relaxed min-h-[100px]">{poData.mandatoryTerms || 'No mandatory terms defined in settings.'}</div>
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-lg flex items-center gap-2 text-primary"><Info className="h-5 w-5" /> Other Terms & Conditions</Label>
                    <div className="p-4 bg-muted/20 border rounded-lg whitespace-pre-wrap text-sm opacity-80 leading-relaxed min-h-[100px]">{poData.otherTerms || 'No additional terms defined.'}</div>
                </div>
            </div>

        </div>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Create Professional Purchase Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
