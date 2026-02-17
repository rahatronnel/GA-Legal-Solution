
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
import { CalendarIcon, User, Building, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useProcurement } from './procurement-provider';
import type { ComparativeStatement } from './cs-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      const loggedInUser = employees.find(e => e.email === user.email);
      
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

      setPoData({
        poNumber: `PO-${cs.csNumber}`,
        poDate: format(new Date(), 'yyyy-MM-dd'),
        demandNoteId: cs.demandNoteId,
        csId: cs.id,
        vendorId: cs.selectedVendorId,
        items: poItems,
        totalAmount,
        discountAmount,
        vatAmount,
        taxAmount,
        netPayableAmount,
        deliveryTerms: selectedVendorDetails?.deliveryTerms,
        paymentTerms: selectedVendorDetails?.paymentTerms,
        warranty: selectedVendorDetails?.warranty,
        status: 'Pending',
        createdBy: loggedInUser?.id || '',
        createdAt: new Date().toISOString(),
        mandatoryTerms: orgSettings.procurementSettings?.poSettings?.mandatoryTerms,
        otherTerms: orgSettings.procurementSettings?.poSettings?.otherTerms,
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
          <DialogTitle>Prepare Purchase Order</DialogTitle>
          <DialogDescription>Review the details and finalize the PO for CS: {cs?.csNumber}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-1"><Label>PO Number</Label><Input value={poData.poNumber} disabled /></div>
            <div className="space-y-1"><Label>PO Date</Label><Input value={poData.poDate} disabled /></div>
            <div className="space-y-1"><Label>DN Contact Person</Label><Input value={contactPerson?.fullName} disabled /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Supplier Details</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p className="font-semibold">{vendor?.vendorName}</p>
                    <p className="text-muted-foreground">{vendor?.officeAddress}</p>
                    <p className="text-muted-foreground">Contact: {vendor?.contactPersonName}</p>
                    <p className="text-muted-foreground">Email: {vendor?.email} | Phone: {vendor?.mobileNumber}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Delivery Location</CardTitle></CardHeader>
                <CardContent className="text-sm">
                    <p className="font-semibold">{demandNote?.deliveryPlace}</p>
                </CardContent>
              </Card>
          </div>
          
          {/* Items Table */}
          <Table>
            <TableHeader><TableRow><TableHead>SL</TableHead><TableHead>Particulars</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader>
            <TableBody>
                {poData.items?.map((item, index) => (
                    <TableRow key={item.demandNoteItemId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.particulars}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Totals Section */}
          <div className="flex justify-end">
             <div className="w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(poData.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span><span>- {formatCurrency(poData.discountAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT:</span><span>+ {formatCurrency(poData.vatAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span><span>+ {formatCurrency(poData.taxAmount)}</span></div>
                <Separator/>
                <div className="flex justify-between font-bold text-base"><span className="text-foreground">Grand Total:</span><span>{formatCurrency(poData.netPayableAmount)}</span></div>
            </div>
          </div>
          
          <Separator/>
          
          {/* Manual Inputs & Terms */}
           <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Expected Delivery Date</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4"/>{expectedDeliveryDate ? format(expectedDeliveryDate, 'PPP') : 'Pick a date'}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expectedDeliveryDate} onSelect={handleDateChange} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Comments / Special Instructions</Label>
                        <Textarea id="comments" value={poData.comments || ''} onChange={handleInputChange}/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <input type="checkbox" id="confirmedBySupplier" checked={poData.confirmedBySupplier} onChange={e => handleCheckboxChange(e.target.checked)} className="form-checkbox h-4 w-4 text-primary rounded" />
                        <Label htmlFor="confirmedBySupplier">Confirmed by Supplier</Label>
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Delivery Terms</Label>
                        <Textarea value={poData.deliveryTerms} readOnly/>
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Terms</Label>
                        <Textarea value={poData.paymentTerms} readOnly/>
                    </div>
                     <div className="space-y-2">
                        <Label>Warranty</Label>
                        <Textarea value={poData.warranty} readOnly/>
                    </div>
                </div>
           </div>
            <Separator/>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-bold">Mandatory Terms & Conditions</Label>
                    <Textarea value={poData.mandatoryTerms} readOnly rows={5}/>
                </div>
                <div className="space-y-2">
                    <Label className="font-bold">Other Terms & Conditions</Label>
                    <Textarea value={poData.otherTerms} readOnly rows={5}/>
                </div>
            </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create Purchase Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
