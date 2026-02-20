'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProcurement } from '../../components/procurement-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, Printer, FileText, Check, X, CheckCircle, Hourglass, MoreHorizontal, User as UserIcon, Building, DollarSign, Calendar, Upload, Download, Copy, ChevronRight, ChevronLeft, AlertTriangle, Send 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { getPOStatusText, getNextApprovalStatusCode } from '../../lib/status-helper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PurchaseOrder, UploadedFile } from '../../components/po-entry-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { imageToDataUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</div>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

type DocType = 'poAcknowledgement' | 'invoice' | 'mushok' | 'challan';
const documentLabels: Record<DocType, string> = {
    poAcknowledgement: 'PO Acknowledgement',
    invoice: 'Vendor Invoice',
    mushok: 'Mushok (VAT)',
    challan: 'Delivery Challan',
};

const POApprovalWizard = ({
    po,
    isOpen,
    onOpenChange,
    onApprove,
    vendor
}: {
    po: PurchaseOrder | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: () => void;
    vendor: any;
}) => {
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!po) return null;

    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Approve Purchase Order: {po.poNumber}</DialogTitle>
                    <DialogDescription>Review vendor and financial data to sign off on this commitment.</DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </DialogHeader>

                <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 dark:text-blue-400">
                                <Building className="h-5 w-5" />
                                <h3 className="font-bold">Step 1: Vendor Audit</h3>
                            </div>
                            <Card className="bg-muted/30 border-primary/10">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Supplier Name</Label>
                                        <p className="text-lg font-bold">{vendor?.vendorName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Office Address</Label>
                                        <p className="text-sm">{vendor?.officeAddress || 'N/A'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Person</Label>
                                            <p className="text-sm font-semibold">{vendor?.contactPersonName || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vendor Email</Label>
                                            <p className="text-sm">{vendor?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 dark:text-green-400">
                                <DollarSign className="h-5 w-5" />
                                <h3 className="font-bold">Step 2: Financial Verification</h3>
                            </div>
                            <Card className="bg-muted/30 border-primary/10">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Subtotal Amount:</span><span className="font-bold">{formatCurrency(po.totalAmount)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Discount Applied:</span><span className="text-red-500 font-bold">- {formatCurrency(po.discountAmount)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">VAT Amount:</span><span className="font-bold">+ {formatCurrency(po.vatAmount)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Tax Amount:</span><span className="font-bold">+ {formatCurrency(po.taxAmount)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-xl"><span className="font-black">Net Billed Amount:</span><span className="text-primary font-black">{formatCurrency(po.netPayableAmount)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Confirm PO Approval</h3>
                                <p className="text-muted-foreground max-w-md">
                                    You are about to sign off on PO <span className="font-bold text-foreground">#{po.poNumber}</span> for <span className="font-bold text-primary">{formatCurrency(po.netPayableAmount)}</span>.
                                </p>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm font-medium text-orange-700 dark:text-orange-400 mt-4">
                                    Your approval will be recorded in the audit history with a digital timestamp.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button onClick={() => setStep(s => s + 1)}>
                                Next Step <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20 font-bold">
                                <Check className="mr-2 h-4 w-4" /> Finalize Approval
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function PurchaseOrderView() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const { purchaseOrders, vendors, demandNotes, employees, designations, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();

    const [isApprovalWizardOpen, setIsApprovalWizardOpen] = useState(false);

    const po = useMemo(() => {
        if (isLoading || !purchaseOrders) return undefined;
        return purchaseOrders.find((p: any) => p.id === params.id) || null;
    }, [params.id, purchaseOrders, isLoading]);

    const demandNote = useMemo(() => {
        if (!po || !demandNotes) return null;
        return demandNotes.find((dn: any) => dn.id === po.demandNoteId);
    }, [po, demandNotes]);

    const vendor = useMemo(() => {
        if (!po || !vendors) return null;
        return vendors.find((v: any) => v.id === po.vendorId);
    }, [po, vendors]);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [employees, user]);
    
    const handleApproval = () => {
        if (!firestore || !po || !user || !po.approvalFlow?.steps || !employees || !currentUserEmployee) return;
        const poRef = doc(firestore, 'purchaseOrders', po.id);
        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { 
            approverId: currentUserEmployee.id, 
            status: 'Approved', 
            timestamp: new Date().toISOString(), 
            level: currentLevel, 
            remarks: `Approved via detailed profile wizard` 
        };
        let nextStatus = currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1;
        let nextApprover = currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
        
        setDocumentNonBlocking(poRef, { 
            approvalStatus: nextStatus, 
            currentApproverId: nextApprover, 
            approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] 
        }, { merge: true });

        setIsApprovalWizardOpen(false);
        toast({ title: "Approved", description: "The Purchase Order has been signed." });
    };

    const handleReject = () => {
        if (!firestore || !po || !user || !po.approvalFlow?.steps || !employees || !currentUserEmployee) return;
        const poRef = doc(firestore, 'purchaseOrders', po.id);
        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { 
            approverId: currentUserEmployee.id, 
            status: 'Rejected', 
            timestamp: new Date().toISOString(), 
            level: currentLevel, 
            remarks: `Rejected from detailed profile` 
        };
        
        setDocumentNonBlocking(poRef, { 
            approvalStatus: 0, 
            currentApproverId: '', 
            approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] 
        }, { merge: true });
        
        toast({ variant: "destructive", title: "Rejected", description: "The Purchase Order has been rejected." });
    }

    const handleSendToVendor = () => {
        if (!firestore || !po) return;
        const poRef = doc(firestore, 'purchaseOrders', po.id);
        setDocumentNonBlocking(poRef, {
            isSentToVendor: true,
            sentToVendorDate: new Date().toISOString()
        }, { merge: true });
        toast({ title: "PO Sent", description: "Purchase Order has been marked as sent to vendor." });
    }

    const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && po && firestore) {
            const files = Array.from(e.target.files);
            const newFiles: UploadedFile[] = [];
            for (const file of files) {
                try {
                    const dataUrl = await imageToDataUrl(file);
                    newFiles.push({ id: Date.now().toString() + Math.random(), name: file.name, file: dataUrl });
                } catch (error) { toast({ variant: 'destructive', title: 'File Error' }); }
            }
            const currentDocs = po.documents || { poAcknowledgement: [], invoice: [], mushok: [], challan: [] };
            const updatedDocs = { ...currentDocs, [docType]: [...(currentDocs[docType] || []), ...newFiles] };
            setDocumentNonBlocking(doc(firestore, 'purchaseOrders', po.id), { documents: updatedDocs }, { merge: true });
            toast({ title: "Upload Success", description: `${newFiles.length} files added to ${documentLabels[docType]}.` });
        }
    };

    const isPendingApproval = po?.approvalStatus !== 0 && po?.approvalStatus !== 1;
    const canApprove = currentUserEmployee && po?.currentApproverId === currentUserEmployee.id;
    const isApproved = po?.approvalStatus === 1;
    
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
    const canSend = isApproved && !po?.isSentToVendor && (isSuperAdmin || isGPOfficer || (currentUserEmployee && demandNote?.gpConcernOfficerId === currentUserEmployee.id));

    if (isLoading || po === undefined) return <div className="p-8 text-center animate-pulse">Loading PO Details...</div>;
    if (po === null) notFound();

    return (
        <TooltipProvider>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl font-bold">Purchase Order: {po.poNumber}</CardTitle>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Copy PO#</TooltipContent></Tooltip>
                            </div>
                             <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span>For DN: </span><Link href={`/procurement/local-purchase/demand-notes/${po.demandNoteId}`} className="text-primary hover:underline">{demandNote?.demandNoteNumber || 'N/A'}</Link>
                                <span> | Status: </span><Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canApprove && isPendingApproval && (
                                <>
                                 <Button size="sm" variant="outline" className="text-green-500 border-green-500" onClick={() => setIsApprovalWizardOpen(true)}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Reject PO?</AlertDialogTitle><AlertDialogDescription>This will stop the approval process permanently.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleReject}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                                </>
                            )}
                            {canSend && (
                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-600" onClick={handleSendToVendor}><Send className="mr-2 h-4 w-4"/>Send to Vendor</Button>
                            )}
                            {isApproved && (
                                <Tooltip><TooltipTrigger asChild><Button onClick={() => window.open(`/procurement/local-purchase/purchase-orders/${po.id}/print`, '_blank')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print PO</Button></TooltipTrigger><TooltipContent>Open in New Tab & Print</TooltipContent></Tooltip>
                            )}
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">PO Details</TabsTrigger>
                    <TabsTrigger value="approval">Approval Flow</TabsTrigger>
                    {isApproved && <TabsTrigger value="documents">Uploads</TabsTrigger>}
                </TabsList>
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card><CardHeader><CardTitle className="text-lg font-bold">Vendor & Delivery</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <InfoItem icon={Building} label="Vendor" value={vendor?.vendorName} />
                        <InfoItem icon={Calendar} label="Expected Delivery" value={po.expectedDeliveryDate} />
                        {po.isSentToVendor && (
                            <InfoItem icon={Send} label="Sent to Vendor On" value={new Date(po.sentToVendorDate!).toLocaleString()} fullWidth />
                        )}
                    </CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-lg font-bold">Ordered Items</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Particulars</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader><TableBody>{po.items.map((item, idx) => (<TableRow key={idx}><TableCell className="font-medium">{item.particulars}</TableCell><TableCell>{item.quantity} {item.unit}</TableCell><TableCell className="text-right font-bold">{item.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                </TabsContent>
                <TabsContent value="approval" className="mt-6">
                     <Card><CardContent className="py-6"><ul className="space-y-4">{po.approvalFlow?.steps.map((step, index) => { const historyEntry = po.approvalHistory?.find(h => h.level === index); const isPending = po.currentApproverId === step.approverId && isPendingApproval; return (<li key={index} className="flex items-start gap-4 list-none">{historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}<div className="flex-1 flex gap-4 items-center"><Avatar className="h-10 w-10 border"><AvatarFallback>{employees?.find(e => e.id === step.approverId)?.fullName?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{employees?.find(e => e.id === step.approverId)?.fullName}</p>{historyEntry && <p className="text-[10px] text-muted-foreground">{new Date(historyEntry.timestamp).toLocaleString()}</p>}</div></div></li>); })}</ul></CardContent></Card>
                </TabsContent>
                {isApproved && (
                    <TabsContent value="documents" className="mt-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {(Object.keys(documentLabels) as DocType[]).map(key => (
                                <Card key={key}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-bold">{documentLabels[key]}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`file-${key}`} className="cursor-pointer text-sm font-bold text-primary hover:underline flex items-center gap-1"><Upload className="h-4 w-4" /> Add File(s)</Label>
                                            <Input id={`file-${key}`} type="file" className="hidden" multiple onChange={handleFileChange(key)} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {po.documents?.[key] && po.documents[key].length > 0 ? (
                                            po.documents[key].map(file => (
                                                <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={file.file} download={file.name} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /></Link></Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm italic">No files uploaded yet.</div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <POApprovalWizard 
                isOpen={isApprovalWizardOpen}
                onOpenChange={setIsApprovalWizardOpen}
                po={po}
                onApprove={handleApproval}
                vendor={vendor}
            />
        </div>
        </TooltipProvider>
    );
}

export default function PurchaseOrderPage() {
    return <PurchaseOrderView />;
}