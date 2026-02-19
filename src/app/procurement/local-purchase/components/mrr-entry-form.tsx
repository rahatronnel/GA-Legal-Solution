
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';
import type { PurchaseOrder } from './po-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type MRRItem = {
  particulars: string;
  description: string;
  receivedQty: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type MRR = {
  id: string;
  mrrNumber: string;
  receivingDate: string;
  departmentName: string;
  sectionName: string;
  supplierName: string;
  supplierAddress: string;
  issueDate: string;
  shipmentType: string;
  containerSize: string;
  containerNo: string;
  invoiceNumber: string;
  demandNoteNumber: string;
  challanNumber: string;
  poId: string;
  items: MRRItem[];
  totalAmount: number;
  goodsCondition: 'Ok' | 'Not Ok';
  packageCondition: 'Ok' | 'Not Ok';
  remarks?: string;
  createdBy: string;
  createdAt: string;
};

interface MRRFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<MRR>) => void;
  po: PurchaseOrder | null;
}

export function MRREntryForm({ isOpen, setIsOpen, onSave, po }: MRRFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { demandNotes, vendors, sections, employees } = useProcurement();
  
  const [mrrData, setMrrData] = useState<Partial<MRR>>({});
  const [receivingDate, setReceivingDate] = useState<Date | undefined>(new Date());
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());

  const relatedDN = useMemo(() => po ? demandNotes.find(dn => dn.id === po.demandNoteId) : null, [po, demandNotes]);
  const relatedVendor = useMemo(() => po ? vendors.find(v => v.id === po.vendorId) : null, [po, vendors]);
  const relatedSection = useMemo(() => relatedDN ? sections.find(s => s.id === relatedDN.sectionId) : null, [relatedDN, sections]);

  useEffect(() => {
    if (isOpen && po && user && employees.length > 0) {
      const loggedInEmployee = employees.find(e => e.email === user.email);
      const now = new Date();
      
      const mrrItems: MRRItem[] = po.items.map(item => ({
        particulars: item.particulars,
        description: '', // User to fill manually
        receivedQty: item.quantity, // Default to full PO quantity
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.totalPrice
      }));

      setMrrData({
        mrrNumber: `MRR-${po.poNumber.split('-').pop()}-${Date.now().toString().slice(-4)}`,
        receivingDate: format(now, 'yyyy-MM-dd'),
        issueDate: format(now, 'yyyy-MM-dd'),
        departmentName: relatedSection?.name || 'N/A',
        sectionName: relatedSection?.name || 'N/A',
        supplierName: relatedVendor?.vendorName || 'N/A',
        supplierAddress: relatedVendor?.officeAddress || 'N/A',
        demandNoteNumber: relatedDN?.demandNoteNumber || 'N/A',
        poId: po.id,
        items: mrrItems,
        totalAmount: po.totalAmount,
        goodsCondition: 'Ok',
        packageCondition: 'Ok',
        shipmentType: '',
        containerSize: '',
        containerNo: '',
        invoiceNumber: '',
        challanNumber: '',
        remarks: '',
        createdBy: loggedInEmployee?.id || '',
        createdAt: now.toISOString(),
      });
      setReceivingDate(now);
      setIssueDate(now);
    }
  }, [isOpen, po, user, employees, relatedDN, relatedVendor, relatedSection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setMrrData(prev => ({ ...prev, [id]: value }));
  };

  const handleItemDescriptionChange = (index: number, value: string) => {
    setMrrData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index].description = value;
      return { ...prev, items: newItems };
    });
  };

  const handleSave = () => {
    if (!mrrData.invoiceNumber || !mrrData.challanNumber || !mrrData.shipmentType) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill Shipment Type, Invoice No and Challan No.' });
      return;
    }
    onSave(mrrData);
    setIsOpen(false);
  };

  if (!po || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prepare Material Receiving Report (MRR)</DialogTitle>
          <DialogDescription>Record receipt of goods for PO: {po.poNumber}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>MRR Number</Label><Input value={mrrData.mrrNumber || ''} disabled /></div>
            <div className="space-y-2">
              <Label>Receiving Date</Label>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{receivingDate ? format(receivingDate, "PPP") : "Pick a date"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receivingDate} onSelect={(d) => { setReceivingDate(d); setMrrData(p => ({...p, receivingDate: d ? format(d, 'yyyy-MM-dd') : ''})) }} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{issueDate ? format(issueDate, "PPP") : "Pick a date"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={issueDate} onSelect={(d) => { setIssueDate(d); setMrrData(p => ({...p, issueDate: d ? format(d, 'yyyy-MM-dd') : ''})) }} /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="py-2"><CardTitle className="text-sm">Source Info</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Department:</strong> {mrrData.departmentName}</p>
                <p><strong>Demand Note:</strong> {mrrData.demandNoteNumber}</p>
                <p><strong>Supplier:</strong> {mrrData.supplierName}</p>
                <p className="text-xs text-muted-foreground">{mrrData.supplierAddress}</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>Invoice No</Label><Input id="invoiceNumber" value={mrrData.invoiceNumber} onChange={handleInputChange} /></div>
               <div className="space-y-2"><Label>Challan No</Label><Input id="challanNumber" value={mrrData.challanNumber} onChange={handleInputChange} /></div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Shipment Type</Label><Input id="shipmentType" value={mrrData.shipmentType} onChange={handleInputChange} placeholder="e.g. Air, Sea, Road" /></div>
            <div className="space-y-2"><Label>Container Size</Label><Input id="containerSize" value={mrrData.containerSize} onChange={handleInputChange} /></div>
            <div className="space-y-2"><Label>Container No</Label><Input id="containerNo" value={mrrData.containerNo} onChange={handleInputChange} /></div>
          </div>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Received Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">SL</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead>Description (Manual)</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrrData.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.particulars}</TableCell>
                      <TableCell><Input value={item.description} onChange={(e) => handleItemDescriptionChange(index, e.target.value)} placeholder="Type description..." /></TableCell>
                      <TableCell className="text-center">{item.receivedQty}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={5} className="text-right">Grand Total</TableCell>
                    <TableCell className="text-right">{mrrData.totalAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goods Condition</Label>
                <Select value={mrrData.goodsCondition} onValueChange={(v) => setMrrData(p => ({...p, goodsCondition: v as any}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ok">Ok</SelectItem><SelectItem value="Not Ok">Not Ok</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Box/Package Condition</Label>
                <Select value={mrrData.packageCondition} onValueChange={(v) => setMrrData(p => ({...p, packageCondition: v as any}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ok">Ok</SelectItem><SelectItem value="Not Ok">Not Ok</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Textarea id="remarks" value={mrrData.remarks} onChange={handleInputChange} rows={4} placeholder="Type any additional notes here..." />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Material Receiving Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
