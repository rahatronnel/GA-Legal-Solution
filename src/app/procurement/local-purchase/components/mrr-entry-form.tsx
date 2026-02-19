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
import { 
    CalendarIcon, 
    Hash, 
    Building2, 
    User, 
    MapPin, 
    FileText, 
    Receipt, 
    ClipboardList, 
    Truck, 
    Box, 
    Archive, 
    CheckCircle2, 
    MessageSquare, 
    DollarSign,
    Ruler,
    Layers,
    ListOrdered,
    ArrowDownCircle,
    Info,
    Container,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn, imageToDataUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';
import type { PurchaseOrder, UploadedFile } from './po-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  MRR_IssueDate: string; 
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
  receiverConfirmantId?: string;
  documents: {
      bill: UploadedFile[];
      challan: UploadedFile[];
  };
  approvalStatus: number;
  currentApproverId: string;
  approvalHistory: any[];
  approvalFlow?: {
      steps: { stepName: string; approverId: string; }[];
  };
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
        description: '', 
        receivedQty: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.totalPrice
      }));

      setMrrData({
        mrrNumber: `MRR-${po.poNumber.split('-').pop()}-${Date.now().toString().slice(-4)}`,
        receivingDate: format(now, 'yyyy-MM-dd'),
        MRR_IssueDate: format(now, 'yyyy-MM-dd'),
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
        approvalStatus: 2, 
        currentApproverId: '',
        approvalHistory: [],
        documents: { bill: [], challan: [] }
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
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Shipment Type, Invoice No and Challan No are mandatory.' });
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
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowDownCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-2xl">Prepare Material Receiving Report (MRR)</DialogTitle>
                <DialogDescription>Record physical receipt of goods for Purchase Order: <span className="font-bold text-foreground">{po.poNumber}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Hash className="h-3 w-3" /> MRR Number</Label>
              <Input value={mrrData.mrrNumber || ''} disabled className="bg-muted/50 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><CalendarIcon className="h-3 w-3" /> Receiving Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{receivingDate ? format(receivingDate, "PPP") : "Pick date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receivingDate} onSelect={(d) => { setReceivingDate(d); setMrrData(p => ({...p, receivingDate: d ? format(d, 'yyyy-MM-dd') : ''})) }} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><CalendarIcon className="h-3 w-3" /> MRR Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{issueDate ? format(issueDate, "PPP") : "Pick date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={issueDate} onSelect={(d) => { setIssueDate(d); setMrrData(p => ({...p, MRR_IssueDate: d ? format(d, 'yyyy-MM-dd') : ''})) }} /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardHeader className="py-2 border-b">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Organizational Source</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 pt-3">
                <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium flex items-center gap-2"><Building2 className="h-3 w-3"/> Department:</span><span className="font-semibold">{mrrData.departmentName}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium flex items-center gap-2"><Layers className="h-3 w-3"/> Section:</span><span className="font-semibold">{mrrData.sectionName}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium flex items-center gap-2"><Hash className="h-3 w-3"/> Demand Note Ref:</span><Badge variant="outline">{mrrData.demandNoteNumber}</Badge></div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20 shadow-sm">
              <CardHeader className="py-2 border-b">
                <CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 pt-3">
                <div className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-muted-foreground" /> {mrrData.supplierName}</div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin className="h-4 w-4 flex-shrink-0" /> {mrrData.supplierAddress}</div>
              </CardContent>
            </Card>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-primary"><Truck className="h-5 w-5" /> Logistics & Shipment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Truck className="h-4 w-4" /> Shipment Type</Label>
                    <Input id="shipmentType" value={mrrData.shipmentType || ''} onChange={handleInputChange} placeholder="e.g. Air, Sea, Road" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Ruler className="h-4 w-4" /> Container Size</Label>
                    <Input id="containerSize" value={mrrData.containerSize || ''} onChange={handleInputChange} placeholder="e.g. 20ft, 40ft" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Container className="h-4 w-4" /> Container Number</Label>
                    <Input id="containerNo" value={mrrData.containerNo || ''} onChange={handleInputChange} placeholder="Container ID" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Receipt className="h-4 w-4" /> Invoice Number <span className="text-red-500">*</span></Label>
                    <Input id="invoiceNumber" value={mrrData.invoiceNumber || ''} onChange={handleInputChange} placeholder="Enter vendor invoice #" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><ClipboardList className="h-4 w-4" /> Challan Number <span className="text-red-500">*</span></Label>
                    <Input id="challanNumber" value={mrrData.challanNumber || ''} onChange={handleInputChange} placeholder="Enter delivery challan #" />
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-primary"><Layers className="h-5 w-5" /> Material Verification (Item Details)</h4>
            <Card className="border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-12 text-center"><ListOrdered className="h-4 w-4 mx-auto" /></TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead className="min-w-[200px]"><Info className="h-4 w-4 inline mr-2" />Material Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">Unit</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(mrrData.items || []).map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{item.particulars}</TableCell>
                        <TableCell><Input value={item.description} onChange={(e) => handleItemDescriptionChange(index, e.target.value)} placeholder="Type manual description..." className="h-8 text-sm" /></TableCell>
                        <TableCell className="text-center font-medium">{item.receivedQty}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{item.unit}</Badge></TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/20">
                        <TableCell colSpan={5} className="text-right text-lg uppercase tracking-tight flex items-center justify-end gap-2"><DollarSign className="h-5 w-5"/> Grand Total Amount</TableCell>
                        <TableCell className="text-right text-lg font-black text-primary underline underline-offset-4 decoration-double">
                            {mrrData.totalAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </TableCell>
                    </TableRow>
                    </TableBody>
                </Table>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 border shadow-sm space-y-4">
              <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Physical Inspection</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><CheckCircle2 className="h-4 w-4" /> Goods Condition</Label>
                    <Select value={mrrData.goodsCondition} onValueChange={(v) => setMrrData(p => ({...p, goodsCondition: v as any}))}>
                    <SelectTrigger className={cn(mrrData.goodsCondition === 'Ok' ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ok" className="text-green-600 font-bold">✅ Good / Ok</SelectItem>
                        <SelectItem value="Not Ok" className="text-red-600 font-bold">❌ Damaged / Not Ok</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Box className="h-4 w-4" /> Box / Package Condition</Label>
                    <Select value={mrrData.packageCondition} onValueChange={(v) => setMrrData(p => ({...p, packageCondition: v as any}))}>
                    <SelectTrigger className={cn(mrrData.packageCondition === 'Ok' ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ok" className="text-green-600 font-bold">✅ Intact / Ok</SelectItem>
                        <SelectItem value="Not Ok" className="text-red-600 font-bold">❌ Broken / Not Ok</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>
            </Card>
            <div className="space-y-2 p-4 border rounded-lg shadow-sm">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><MessageSquare className="h-5 w-5 text-primary" /> Additional Remarks (Optional)</Label>
              <Textarea id="remarks" value={mrrData.remarks || ''} onChange={handleInputChange} rows={6} placeholder="Type any additional notes, observations or discrepancies here..." className="resize-none" />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex items-center gap-2"><X className="h-4 w-4" /> Cancel</Button>
          <Button onClick={handleSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20">
            <CheckCircle2 className="h-4 w-4" /> Save Material Receiving Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
