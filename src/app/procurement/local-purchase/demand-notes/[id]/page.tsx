
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Download, Printer, Clock, Check, X, Building, CheckCircle, Hourglass, MoreHorizontal, Hash, MapPin, Phone, Upload, Link as LinkIcon, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { DemandNote, Quotation } from '../../components/demand-note-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { useProcurement } from '../../components/procurement-provider';
import type { Designation } from '@/app/user-management/components/designation-table';
import { getDemandNoteStatusText, getNextApprovalStatusCode } from '../../lib/status-helper';
import { cn, imageToDataUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

const DocumentViewer = ({ files, categoryLabel }: { files: { name: string; file: string }[]; categoryLabel: string }) => {
    if (!files || files.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{categoryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {files.map((doc, index) => {
                    const isImage = doc.file.startsWith('data:image/');
                    const fileName = doc.name;
                    return (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm truncate">{fileName}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={doc.file} download={fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download</Link>
                                </Button>
                            </div>
                             {isImage && (
                                <div className="mt-2 rounded-lg overflow-hidden flex justify-center items-center bg-muted/50 aspect-video">
                                    <Image src={doc.file} alt={fileName} width={400} height={225} className="object-contain" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

const QuotationManager: React.FC<{ demandNote: DemandNote, vendors: Vendor[], isReadOnly: boolean }> = ({ demandNote, vendors, isReadOnly }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        setQuotations(demandNote.quotations || []);
    }, [demandNote.quotations]);

    const handleVendorSelectionChange = (vendorId: string) => {
        if (!quotations.find(q => q.vendorId === vendorId)) {
            setQuotations(prev => [...prev, { vendorId, fileName: '', fileDataUrl: '' }]);
        }
    };
    
    const handleRemoveVendor = (vendorId: string) => {
        setQuotations(prev => prev.filter(q => q.vendorId !== vendorId));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, vendorId: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const dataUrl = await imageToDataUrl(file);
                const updatedQuotations = quotations.map(q => 
                    q.vendorId === vendorId ? { ...q, fileName: file.name, fileDataUrl: dataUrl } : q
                );
                setQuotations(updatedQuotations);
                toast({ title: "File Ready", description: `${file.name} is ready to be saved.` });
            } catch (err) {
                toast({ variant: 'destructive', title: 'Upload failed' });
            }
        }
    };

    const handleSave = () => {
        if (!firestore) return;
        const noteRef = doc(firestore, 'demandNotes', demandNote.id);
        setDocumentNonBlocking(noteRef, { quotations }, { merge: true });
        toast({ title: 'Success', description: 'Quotations saved successfully.' });
    };
    
    const assignedVendors = useMemo(() => vendors.filter(v => quotations.some(q => q.vendorId === v.id)), [quotations, vendors]);
    const unassignedVendors = useMemo(() => vendors.filter(v => !quotations.some(q => q.vendorId === v.id)), [quotations, vendors]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Vendor Quotations</CardTitle>
                        <CardDescription>Assign vendors and manage their quotations for this demand note.</CardDescription>
                    </div>
                     {!isReadOnly && (
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Assign Vendor</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search vendor..." />
                                    <CommandList><CommandEmpty>No vendor found.</CommandEmpty><CommandGroup>
                                        {unassignedVendors.map(vendor => (
                                            <CommandItem key={vendor.id} onSelect={() => { handleVendorSelectionChange(vendor.id); setPopoverOpen(false); }}>
                                                {vendor.vendorName}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup></CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {assignedVendors.length > 0 ? assignedVendors.map(vendor => {
                        const quotation = quotations.find(q => q.vendorId === vendor.id);
                        return (
                            <div key={vendor.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="font-semibold">{vendor.vendorName}</div>
                                {quotation?.fileDataUrl ? (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <Link href={quotation.fileDataUrl} download={quotation.fileName} className="text-sm text-primary hover:underline truncate" target="_blank" rel="noopener noreferrer">{quotation.fileName}</Link>
                                    </div>
                                ) : <div className="text-sm text-muted-foreground">No quotation uploaded.</div>}
                                 {!isReadOnly && (
                                     <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Label htmlFor={`upload-${vendor.id}`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4"/> {quotation?.fileDataUrl ? 'Replace' : 'Upload'}</Label>
                                        </Button>
                                        <Input id={`upload-${vendor.id}`} type="file" className="hidden" onChange={(e) => handleFileUpload(e, vendor.id)} />
                                        <Button size="sm" variant="destructive" onClick={() => handleRemoveVendor(vendor.id)}><X className="h-4 w-4"/></Button>
                                     </div>
                                 )}
                            </div>
                        )
                    }) : <p className="text-sm text-muted-foreground text-center py-4">No vendors assigned.</p>}
                </div>
                {!isReadOnly && assignedVendors.length > 0 && <Button onClick={handleSave}>Save Quotations</Button>}
            </CardContent>
        </Card>
    );
};


function DemandNoteProfileContent() {
    const router = useRouter();
    const params = useParams();
    const firestore = useFirestore();
    const { user } = useUser();
    const { handlePrint } = usePrint();
    const { id } = params;
    
    const { demandNotes, employees, sections, processCodes, demandTypes, billItemMasters, vendors, isLoading, orgSettings } = useProcurement();

    const { data: designations } = useCollection<Designation>(useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]));

    const demandNote = React.useMemo(() => {
        if (isLoading || !demandNotes) return undefined;
        return demandNotes.find((dn:any) => dn.id === id) || null;
    }, [id, demandNotes, isLoading]);

    const currentUserEmployee = React.useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
    const isAssignedGPConcern = demandNote?.gpConcernOfficerId === currentUserEmployee?.id;
    const isReadOnly = !isSuperAdmin && !isGPOfficer && !isAssignedGPConcern;

    const handleApproval = (status: number) => {
        if (!firestore || !demandNote || !user || !demandNote.approvalFlow?.steps || !employees) return;
    
        const noteRef = doc(firestore, 'demandNotes', demandNote.id);
        const effectiveApproverId = currentUserEmployee?.id;
        if (!effectiveApproverId) {
            alert('Your employee profile could not be found.');
            return;
        }
    
        const approvalLevels = demandNote.approvalFlow.steps;
        const currentLevel = demandNote.approvalHistory?.length || 0;
    
        const newHistoryEntry = {
            approverId: effectiveApproverId,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Manually updated from details page`,
        };
    
        let updatePayload: Partial<DemandNote> = {
            approvalHistory: [...(demandNote.approvalHistory || []), newHistoryEntry],
        };
    
        if (status === 1) { // If the action is "Approve"
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                updatePayload.approvalStatus = getNextApprovalStatusCode(currentLevel);
                updatePayload.currentApproverId = approvalLevels[nextLevel].approverId;
            } else {
                // This is the final approval
                updatePayload.approvalStatus = 1; // Completed
                updatePayload.currentApproverId = '';
                updatePayload.gpStatus = 'Pending';
            }
        } else { // If the action is "Reject"
            updatePayload.approvalStatus = 0; // Rejected
            updatePayload.currentApproverId = '';
        }
    
        setDocumentNonBlocking(noteRef, updatePayload, { merge: true });
    };

    if (isLoading || demandNote === undefined) {
        return <div className="flex justify-center items-center h-full"><p>Loading Demand Note Details...</p></div>;
    }

    if (demandNote === null) {
        notFound();
    }
    
    const department = sections?.find((s:any) => s.id === demandNote.departmentId);
    const section = sections?.find((s:any) => s.id === demandNote.sectionId);
    const processCode = processCodes?.find((p:any) => p.id === demandNote.processCodeId);
    const demandType = demandTypes?.find((d:any) => d.id === demandNote.demandTypeId);
    const createdBy = employees?.find((e:any) => e.id === demandNote.createdBy);
    
    const getStatusVariant = (status: number | undefined) => {
        if (status === 1) return 'default'; // Completed
        if (status === 0) return 'destructive'; // Rejected
        return 'secondary'; // Pending states
    }

    const formatDateTime = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleString(); } catch { return 'N/A'; }
    }
    
    const isPendingApproval = demandNote.approvalStatus !== 0 && demandNote.approvalStatus !== 1;
    const isFinalApproved = demandNote.approvalStatus === 1;

    const canApprove = user?.email === 'superadmin@galsolution.com' || (currentUserEmployee && demandNote.currentApproverId === currentUserEmployee.id);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{demandNote.demandNoteNumber}</CardTitle>
                            <CardDescription>Date: {demandNote.date} - Status: <Badge variant={getStatusVariant(demandNote.approvalStatus)}>{getDemandNoteStatusText(demandNote)}</Badge></CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             {isPendingApproval && canApprove && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-green-500 border-green-500 hover:bg-green-50 hover:text-green-600"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Approve Demand Note?</AlertDialogTitle><AlertDialogDescription>This will mark the note as approved and send it to the next approver if applicable. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                   <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Reject Demand Note?</AlertDialogTitle><AlertDialogDescription>This will mark the note as rejected and stop the approval process. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(0)} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                   </AlertDialog>
                                </>
                             )}
                             {isFinalApproved && (
                                <Button onClick={() => handlePrint(demandNote, 'demand-note')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                             )}
                             <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview">
                        <TabsList className="mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="quotations">Quotations</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Approval Status</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="space-y-4">
                                        {demandNote.approvalFlow?.steps.map((step, index) => {
                                            const historyEntry = demandNote.approvalHistory?.find(h => h.level === index);
                                            const approver = employees?.find(e => e.id === step.approverId);
                                            const designation = designations?.find(d => d.id === approver?.designationId);
                                            
                                            let status: 'approved' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

                                            if (historyEntry?.status === 'Approved') {
                                                status = 'approved';
                                            } else if (historyEntry?.status === 'Rejected') {
                                                status = 'rejected';
                                            } else if (demandNote.currentApproverId === step.approverId && isPendingApproval) {
                                                status = 'pending';
                                            }


                                            return (
                                                <li key={index} className="flex items-start gap-4">
                                                    <div>
                                                        {status === 'approved' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                                        {status === 'pending' && <Hourglass className="h-6 w-6 text-orange-500 animate-spin" />}
                                                        {status === 'upcoming' && <MoreHorizontal className="h-6 w-6 text-muted-foreground" />}
                                                        {status === 'rejected' && <X className="h-6 w-6 text-destructive" />}
                                                    </div>
                                                    <div className="flex-1 flex gap-4 items-center">
                                                        <Avatar className="h-10 w-10 border">
                                                            <AvatarImage src={approver?.profilePicture} alt={approver?.fullName} />
                                                            <AvatarFallback>{approver?.fullName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{step.stepName}</p>
                                                            <p className="text-sm">{approver?.fullName || 'N/A'} <span className="text-xs text-muted-foreground">({designation?.name || 'N/A'})</span></p>
                                                            {historyEntry && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {historyEntry.status} on {formatDateTime(historyEntry.timestamp)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Key Information</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <InfoItem icon={Building} label="Department" value={department?.name} />
                                    <InfoItem icon={Building} label="Section" value={section?.name} />
                                    <InfoItem icon={Hash} label="Process Code" value={processCode?.name} />
                                    <InfoItem icon={FileText} label="Demand Type" value={demandType?.name} />
                                    <InfoItem icon={MapPin} label="Delivery Place" value={demandNote.deliveryPlace} />
                                    <InfoItem icon={User} label="Contact Person" value={demandNote.contactPersonName} />
                                    <InfoItem icon={Phone} label="Contact Number" value={demandNote.contactPersonNumber} />
                                    <InfoItem icon={User} label="Created By" value={createdBy?.fullName} />
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader><CardTitle>Budget & Purpose</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                     <InfoItem icon={DollarSign} label="Budget Amount" value={demandNote.budgetAmount > 0 ? demandNote.budgetAmount.toLocaleString() : 'N/A'} />
                                    <InfoItem icon={FileText} label="Budget Year & List No." value={demandNote.budgetYearAndListNo} />
                                    <InfoItem icon={FileText} label="Purpose of Requisition" value={demandNote.purpose} fullWidth />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Items</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Particulars</TableHead>
                                                <TableHead>Required Qty</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {demandNote.items.map((item: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.particulars}</TableCell>
                                                    <TableCell>{item.requiredQty}</TableCell>
                                                    <TableCell>{item.unit}</TableCell>
                                                    <TableCell>{item.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="quotations">
                            <QuotationManager demandNote={demandNote} vendors={vendors} isReadOnly={isReadOnly} />
                        </TabsContent>
                        <TabsContent value="documents">
                            <div className="space-y-6">
                               {demandNote.documents?.attachments && demandNote.documents.attachments.length > 0 ? (
                                   <DocumentViewer files={demandNote.documents.attachments} categoryLabel="Attachments" />
                               ) : (
                                   <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No documents were uploaded for this demand note.</p>
                               )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DemandNotePage() {
    return <DemandNoteProfileContent />;
}
