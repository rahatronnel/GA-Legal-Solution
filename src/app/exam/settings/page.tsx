
'use client';

import React, { useState } from 'react';
import { useArs, ArsExam } from '../components/ars-provider';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, PlusCircle, Trash2, Edit, Save, X, 
    Layers, Clock, Hash, CheckCircle2, AlertTriangle, FilePlus, ChevronLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ArsSettingsPage() {
    const { exams, questions, isLoading } = useArs();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState<Partial<ArsExam> | null>(null);
    const [examForm, setExamForm] = useState({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 30, status: 'Draft' });

    const handleSaveExam = () => {
        if (!firestore || !user) return;
        const examsRef = collection(firestore, 'arsExams');

        const data = {
            ...examForm,
            createdBy: user.uid,
            createdAt: new Date().toISOString()
        };

        if (currentExam?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', currentExam.id), data, { merge: true });
            toast({ title: 'Exam Synchronized' });
        } else {
            addDocumentNonBlocking(examsRef, data);
            toast({ title: 'Exam Registry Created' });
        }
        setIsExamModalOpen(false);
    };

    const handleDeleteExam = (id: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'arsExams', id));
        toast({ title: 'Record Purged' });
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">ARS Control Center</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Micro-Management of Organizational Logic</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild>
                        <Link href="/"><ChevronLeft className="h-5 w-5" /> Exit Terminal</Link>
                    </Button>
                    <Button className="h-12 rounded-full font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20" onClick={() => { setCurrentExam(null); setExamForm({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 30, status: 'Draft' }); setIsExamModalOpen(true); }}>
                        <FilePlus className="h-5 w-5" /> New Session
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {exams.map(exam => (
                    <Card key={exam.id} className="bg-white/[0.02] border-white/5 rounded-[32px] overflow-hidden group">
                        <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                            <div className="flex items-center gap-6 flex-1">
                                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-white/10">
                                    <Layers className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{exam.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium">{exam.description || 'No description provided.'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 px-8 border-x border-white/5">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Questions</p>
                                    <p className="text-xl font-black text-white">{questions.filter(q => q.examId === exam.id).length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Marks</p>
                                    <p className="text-xl font-black text-white">{exam.totalMarks}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Pass</p>
                                    <p className="text-xl font-black text-emerald-500">{exam.passingMarks}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={exam.status === 'Published' ? 'default' : 'secondary'} className="font-black text-[10px] uppercase h-6">{exam.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5" onClick={() => { setCurrentExam(exam); setExamForm({ ...exam }); setIsExamModalOpen(true); }}><Edit className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => handleDeleteExam(exam.id)}><Trash2 className="h-5 w-5" /></Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-slate-900 border-white/10 text-white rounded-[40px] animate-dialog-in">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">{currentExam?.id ? 'Modify Registry' : 'New Exam Registry'}</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">Define parameters for the evaluation session.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Title</Label>
                            <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="bg-white/5 border-white/10 h-12 text-lg font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Description</Label>
                            <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className="bg-white/5 border-white/10 min-h-[100px]" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Marks</Label>
                                <Input type="number" value={examForm.totalMarks} onChange={e => setExamForm({...examForm, totalMarks: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pass Goal</Label>
                                <Input type="number" value={examForm.passingMarks} onChange={e => setExamForm({...examForm, passingMarks: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                                <Select value={examForm.status} onValueChange={v => setExamForm({...examForm, status: v})}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Published">Published</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-t border-white/5 pt-6">
                        <Button variant="ghost" onClick={() => setIsExamModalOpen(false)}>Cancel</Button>
                        <Button className="font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20" onClick={handleSaveExam}>Commit to Registry</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
