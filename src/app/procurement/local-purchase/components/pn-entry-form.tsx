
"use client";

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Calendar as CalendarIcon, Hash, DollarSign, FileText, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { numberToWords } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';
import type { MRR } from './mrr-entry-form';

export type PaymentNote = {
  id: string;
  pnNumber: string;
  date: string;
  mrrId: string;
  amount: number;
  amountInWords: string;
  paymentType: 'Credit' | 'LC' | 'Sales Contract' | 'Advance' | 'Rest' | '';
  paymentMode: 'AC Payee' | 'TT' | 'Pay-Order' | 'FDD' | '';
  createdBy: string;
  createdAt: string;
  approvalStatus: number;
  currentApproverId: string;
  approvalHistory: any[];
};

interface PNFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<PaymentNote>) => void;
  mrr: MRR | null;
}

export function PaymentNoteForm({ isOpen, setIsOpen, onSave, mrr }: PNFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { orgSettings, employees } = useProcurement();
  
  const [pnData, setPnData] = useState<Partial<PaymentNote>>({});

  useEffect(() => {
    if (isOpen && mrr && user && employees.length > 0) {
      const loggedInEmployee = employees.find(e => e.email === user.email);
      const amount = mrr.totalAmount || 0;
      const amountWords = numberToWords(amount);
      const purchaseManagerId = orgSettings?.procurementSettings?.csApprovalRoles?.purchaseManagerId || '';

      setPnData({
        pnNumber: `PN-${mrr.mrrNumber.split('-').pop()}-${Date.now().toString().slice(-4)}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        mrrId: mrr.id,
        amount: amount,
        amountInWords: amountWords,
        paymentType: '',
        paymentMode: '',
        createdBy: loggedInEmployee?.id || '',
        createdAt: new Date().toISOString(),
        approvalStatus: 2, // Pending Action
        currentApproverId: purchaseManagerId,
        approvalHistory: [],
      });
    }
  }, [isOpen, mrr, user, employees, orgSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPnData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof PaymentNote) => (value: string) => {
    setPnData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (!pnData.paymentType || !pnData.paymentMode) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select Payment Type and Mode.' });
      return;
    }
    onSave(pnData);
    setIsOpen(false);
  };

  if (!mrr || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl animate-dialog-in">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Wallet className="h-6 w-6" /></div>
            <div>
                <DialogTitle className="text-2xl">Create Payment Note (PN)</DialogTitle>
                <DialogDescription>Initiate official payment request for MRR: <span className="font-bold text-foreground">{mrr.mrrNumber}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2"><Hash className="h-3 w-3" /> PN Number</Label>
                <Input value={pnData.pnNumber || ''} disabled className="bg-muted/50 font-bold" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2"><CalendarIcon className="h-3 w-3" /> Date</Label>
                <Input value={pnData.date || ''} disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-xl bg-primary/5">
            <div className="space-y-1">
                <Label className="text-xs uppercase font-bold text-primary flex items-center gap-2"><DollarSign className="h-3 w-3" /> Total Amount (BDT)</Label>
                <div className="text-3xl font-black tracking-tight">{pnData.amount?.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/-</span></div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2"><FileText className="h-3 w-3" /> Amount in Words</Label>
                <p className="text-sm italic font-medium">"{pnData.amountInWords}"</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Payment Type</Label>
                <Select value={pnData.paymentType} onValueChange={handleSelectChange('paymentType')}>
                    <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Credit">Credit</SelectItem>
                        <SelectItem value="LC">Letter of Credit (LC)</SelectItem>
                        <SelectItem value="Sales Contract">Sales Contract</SelectItem>
                        <SelectItem value="Advance">Advance Payment</SelectItem>
                        <SelectItem value="Rest">Rest Amount</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Payment Mode</Label>
                <Select value={pnData.paymentMode} onValueChange={handleSelectChange('paymentMode')}>
                    <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Select mode..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AC Payee">A/C Payee Cheque</SelectItem>
                        <SelectItem value="TT">Telegraphic Transfer (TT)</SelectItem>
                        <SelectItem value="Pay-Order">Pay-Order</SelectItem>
                        <SelectItem value="FDD">FDD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 font-bold"><CheckCircle2 className="mr-2 h-4 w-4" /> Prepare Payment Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
