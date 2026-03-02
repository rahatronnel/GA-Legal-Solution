
'use client';

import React, { useState } from 'react';
import { useArs, ArsExam, ArsQuestion } from '../components/ars-provider';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
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
    Layers, Clock, Hash, CheckCircle2, AlertTriangle, FilePlus, ChevronLeft,
    Play, Square, ChevronRight, Monitor, ListChecks, HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function ArsSettingsPage() {
    const { exams, questions, isLoading } = useArs();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState<ArsExam | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<ArsQuestion> | null>(null);

    const [examForm, setExamForm] = useState({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 10, status: 'Draft', type: 'Exam' as 'Exam' | 'Survey' });
    const [questionForm, setQuestionForm] = useState<Omit<ArsQuestion, 'id'>>({ examId: '', questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1 });

    const handleSaveExam = () => {
        if (!firestore || !user) return;
        const examsRef = collection(firestore, 'arsExams');
        const data = { ...examForm, createdBy: user.uid, createdAt: new Date().toISOString() };

        if (currentExam?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', currentExam.id), data, { merge: true });
            toast({ title: 'Registry Updated' });
        } else {
            addDocumentNonBlocking(examsRef, { ...data, isLive: false, activeQuestionIndex: -1 });
            toast({ title: 'New Registry Created' });
        }
        setIsExamModalOpen(false);
    };

    const handleSaveQuestion = () => {
        if (!firestore || !currentExam) return;
        const questionsRef = collection(firestore, 'arsQuestions');
        const data = { ...questionForm, examId: currentExam.id };

        if (currentQuestion?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsQuestions', currentQuestion.id), data, { merge: true });
            toast({ title: 'Question Updated' });
        } else {
            addDocumentNonBlocking(questionsRef, data);
            toast({ title: 'Question Added' });
        }
        setIsQuestionModalOpen(false);
    };

    const toggleLiveSession = (exam: ArsExam) => {
        if (!firestore) return;
        setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
            isLive: !exam.isLive,
            activeQuestionIndex: !exam.isLive ? 0 : -1 
        }, { merge: true });
        toast({ title: exam.isLive ? 'Session Halted' : 'Session Broadcast Active' });
    };

    const nextLiveQuestion = (exam: ArsExam) => {
        if (!firestore) return;
        const examQuestions = questions.filter(q => q.examId === exam.id);
        if (exam.activeQuestionIndex < examQuestions.length - 1) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                activeQuestionIndex: exam.activeQuestionIndex + 1 
            }, { merge: true });
        } else {
            // End of session
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                isLive: false,
                activeQuestionIndex: -1 
            }, { merge: true });
            toast({ title: 'Session Concluded' });
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-50">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">ARS Control Center</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Manage Live Seminar Logic</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild>
                        <Link href="/"><ChevronLeft className="h-5 w-5" /> Exit Terminal</Link>
                    </Button>
                    <Button className="h-12 rounded-full font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20" onClick={() => { setCurrentExam(null); setExamForm({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 10, status: 'Draft', type: 'Exam' }); setIsExamModalOpen(true); }}>
                        <FilePlus className="h-5 w-5" /> New Session
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {exams.map(exam => {
                    const examQuestions = questions.filter(q => q.examId === exam.id);
                    return (
                        <Card key={exam.id} className="bg-white/[0.02] border-white/5 rounded-[32px] overflow-hidden group">
                            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-white/10">
                                        <Layers className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{exam.title}</h3>
                                            <Badge className="bg-primary/20 text-primary uppercase text-[10px] font-black">{exam.type}</Badge>
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium">{exam.description || 'No internal description.'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-8 px-8 border-x border-white/5">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Logic Step</p>
                                        <p className="text-xl font-black text-white">{examQuestions.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Duration</p>
                                        <p className="text-xl font-black text-white">{exam.timeLimitMinutes}m</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {exam.status === 'Published' && (
                                        <>
                                            <Button 
                                                variant={exam.isLive ? "destructive" : "outline"} 
                                                className="rounded-full gap-2 font-black uppercase tracking-widest text-[10px] h-10 px-6"
                                                onClick={() => toggleLiveSession(exam)}
                                            >
                                                {exam.isLive ? <><Square className="h-3 w-3 fill-current" /> Halt Session</> : <><Play className="h-3 w-3 fill-current" /> Broadcast Live</>}
                                            </Button>
                                            {exam.isLive && (
                                                <Button className="h-10 rounded-full gap-2 font-black uppercase tracking-widest text-[10px]" onClick={() => nextLiveQuestion(exam)}>
                                                    Next Question <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-400" asChild>
                                                <Link href={`/exam/display?id=${exam.id}`} target="_blank"><Monitor className="h-5 w-5" /></Link>
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => { setCurrentExam(exam); setIsQuestionModalOpen(true); setQuestionForm({ examId: exam.id, questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1 }); }}><PlusCircle className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setCurrentExam(exam); setExamForm({ ...exam }); setIsExamModalOpen(true); }}><Edit className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'arsExams', exam.id))}><Trash2 className="h-5 w-5" /></Button>
                                </div>
                            </div>

                            {/* Question List Expansion */}
                            {examQuestions.length > 0 && (
                                <div className="px-8 pb-8">
                                    <div className="bg-black/20 rounded-2xl border border-white/5 divide-y divide-white/5">
                                        {examQuestions.map((q, i) => (
                                            <div key={q.id} className="p-4 flex items-center justify-between group/q">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-muted-foreground w-4">{i + 1}.</span>
                                                    <p className="text-sm font-bold">{q.questionText}</p>
                                                    {exam.type === 'Exam' && <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-500 font-black">{q.correctOption}</Badge>}
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentExam(exam); setCurrentQuestion(q); setQuestionForm({ ...q }); setIsQuestionModalOpen(true); }}><Edit className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'arsQuestions', q.id))}><X className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Exam/Survey Creation Modal */}
            <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-slate-900 border-white/10 text-white rounded-[40px] animate-dialog-in">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">{currentExam?.id ? 'Modify Registry' : 'New Session Registry'}</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">Define parameters for the evaluation or survey.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Title</Label>
                                <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry Type</Label>
                                <Select value={examForm.type} onValueChange={v => setExamForm({...examForm, type: v as any})}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="Exam">Graded Examination</SelectItem>
                                        <SelectItem value="Survey">Audience Survey</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                            <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className="bg-white/5 border-white/10" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Marks</Label>
                                <Input type="number" value={examForm.totalMarks} onChange={e => setExamForm({...examForm, totalMarks: Number(e.target.value)})} className="bg-white/5 border-white/10" disabled={examForm.type === 'Survey'} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pass Goal</Label>
                                <Input type="number" value={examForm.passingMarks} onChange={e => setExamForm({...examForm, passingMarks: Number(e.target.value)})} className="bg-white/5 border-white/10" disabled={examForm.type === 'Survey'} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifecycle</Label>
                                <Select value={examForm.status} onValueChange={v => setExamForm({...examForm, status: v})}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10"><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem><SelectItem value="Archived">Archived</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsExamModalOpen(false)}>Cancel</Button><Button onClick={handleSaveExam}>Commit Registry</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Question Creation Modal */}
            <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
                <DialogContent className="sm:max-w-3xl bg-slate-900 border-white/10 text-white rounded-[40px] animate-dialog-in">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Question Logic Entry</DialogTitle>
                        <DialogDescription className="text-slate-400">Define the interaction point for session: {currentExam?.title}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prompt Text</Label>
                            <Input value={questionForm.questionText} onChange={e => setQuestionForm({...questionForm, questionText: e.target.value})} className="bg-white/5 border-white/10 text-lg font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Options Array</Label>
                                {questionForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="h-10 w-10 flex items-center justify-center font-black text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                                        <Input value={opt} onChange={e => { const n = [...questionForm.options]; n[i] = e.target.value; setQuestionForm({...questionForm, options: n}); }} className="bg-white/5 border-white/10" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signal Type</Label>
                                    <Select value={questionForm.type} onValueChange={v => setQuestionForm({...questionForm, type: v as any})}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10"><SelectItem value="MCQ">Multiple Choice</SelectItem><SelectItem value="True/False">Binary True/False</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                {currentExam?.type === 'Exam' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-emerald-500">Correct Signal (Validation)</Label>
                                        <Select value={questionForm.correctOption} onValueChange={v => setQuestionForm({...questionForm, correctOption: v})}>
                                            <SelectTrigger className="bg-emerald-500/10 border-emerald-500/20"><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-white/10">
                                                {questionForm.options.map((opt, i) => opt && <SelectItem key={i} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weightage (Points)</Label>
                                    <Input type="number" value={questionForm.points} onChange={e => setQuestionForm({...questionForm, points: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button><Button onClick={handleSaveQuestion}>Inject Logic</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
