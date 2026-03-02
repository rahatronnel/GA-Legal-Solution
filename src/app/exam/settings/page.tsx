
'use client';

import React, { useState, useRef } from 'react';
import { useArs, ArsExam, ArsQuestion } from '../components/ars-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
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
    Play, Square, ChevronRight, Monitor, ListChecks, HelpCircle, Radio, Sparkles,
    Upload, Download, FileSpreadsheet, Cpu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function ArsSettingsPage() {
    const { exams, questions, isLoading } = useArs();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState<ArsExam | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<ArsQuestion> | null>(null);

    const [examForm, setExamForm] = useState({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 10, status: 'Draft', type: 'Exam' as 'Exam' | 'Survey' });
    const [questionForm, setQuestionForm] = useState<Omit<ArsQuestion, 'id'>>({ examId: '', questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1 });

    useGSAP(() => {
        if (!isLoading) {
            gsap.from(".ars-card-animate", {
                y: 30,
                opacity: 0,
                stagger: 0.1,
                duration: 0.6,
                ease: "expo.out"
            });
        }
    }, [isLoading, exams.length]);

    const handleSaveExam = () => {
        if (!firestore || !user) return;
        const examsRef = collection(firestore, 'arsExams');
        const data = { ...examForm, createdBy: user.uid, createdAt: new Date().toISOString() };

        if (currentExam?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', currentExam.id), data, { merge: true });
            toast({ title: 'Registry Updated' });
        } else {
            addDocumentNonBlocking(examsRef, { ...data, isLive: false, activeQuestionIndex: -1 });
            toast({ title: 'New Session Registry Created' });
        }
        setIsExamModalOpen(false);
    };

    const handleSaveQuestion = () => {
        if (!firestore || !currentExam) return;
        const questionsRef = collection(firestore, 'arsQuestions');
        const data = { ...questionForm, examId: currentExam.id };

        if (currentQuestion?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsQuestions', currentQuestion.id), data, { merge: true });
            toast({ title: 'Question Logic Synced' });
        } else {
            addDocumentNonBlocking(questionsRef, data);
            toast({ title: 'Question Injected' });
        }
        setIsQuestionModalOpen(false);
    };

    const handleDownloadTemplate = () => {
        const wsData = [
            {
                questionText: "What is the primary objective of this session?",
                type: "MCQ",
                optionA: "Option 1",
                optionB: "Option 2",
                optionC: "Option 3",
                optionD: "Option 4",
                correctOption: "Option 1",
                points: 10
            }
        ];
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Questions");
        XLSX.writeFile(wb, "ARS_Question_Template.xlsx");
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>, examId: string) => {
        const file = e.target.files?.[0];
        if (!file || !firestore) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                if (json.length === 0) throw new Error("No data found in spreadsheet.");

                const questionsRef = collection(firestore, 'arsQuestions');
                
                json.forEach(row => {
                    const questionData: Omit<ArsQuestion, 'id'> = {
                        examId: examId,
                        questionText: String(row.questionText || ''),
                        type: (row.type === 'True/False' ? 'True/False' : 'MCQ') as any,
                        options: [
                            String(row.optionA || ''),
                            String(row.optionB || ''),
                            String(row.optionC || ''),
                            String(row.optionD || '')
                        ].filter(o => o !== ''),
                        correctOption: String(row.correctOption || ''),
                        points: Number(row.points) || 1
                    };
                    addDocumentNonBlocking(questionsRef, questionData);
                });

                toast({ title: "Bulk Injection Success", description: `${json.length} questions synchronized.` });
            } catch (err: any) {
                toast({ variant: "destructive", title: "Upload Failed", description: err.message });
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const toggleLiveSession = (exam: ArsExam) => {
        if (!firestore) return;
        const newState = !exam.isLive;
        setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
            isLive: newState,
            activeQuestionIndex: newState ? 0 : -1 
        }, { merge: true });
        toast({ 
            title: newState ? 'Broadcast Active' : 'Broadcast Halted'
        });
    };

    const nextLiveQuestion = (exam: ArsExam) => {
        if (!firestore) return;
        const examQuestions = questions.filter(q => q.examId === exam.id);
        if (exam.activeQuestionIndex < examQuestions.length - 1) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                activeQuestionIndex: exam.activeQuestionIndex + 1 
            }, { merge: true });
            toast({ title: 'Signal Pushed' });
        } else {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                isLive: false,
                activeQuestionIndex: -1 
            }, { merge: true });
            toast({ title: 'Session Concluded' });
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-50" ref={containerRef}>
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 border-b border-white/5 bg-white/[0.02] rounded-[32px]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Radio className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">ARS Master Console</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 italic">Define High-Fidelity Interaction Logic</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild>
                        <Link href="/"><ChevronLeft className="h-5 w-5" /> Exit Terminal</Link>
                    </Button>
                    <Button className="h-12 rounded-full font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:scale-105 transition-all px-8" onClick={() => { setCurrentExam(null); setExamForm({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 10, status: 'Draft', type: 'Exam' }); setIsExamModalOpen(true); }}>
                        <PlusCircle className="h-5 w-5" /> Register New Session
                    </Button>
                </div>
            </div>

            {/* Session Matrix */}
            <div className="grid grid-cols-1 gap-8">
                {exams.map(exam => {
                    const examQuestions = questions.filter(q => q.examId === exam.id);
                    return (
                        <Card key={exam.id} className="bg-white/[0.02] border-white/5 rounded-[40px] overflow-hidden group ars-card-animate hover:bg-white/[0.04] transition-all relative">
                            <div className="p-10 flex flex-col lg:row items-center justify-between gap-8 lg:flex-row">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-6 transition-transform">
                                        <Layers className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{exam.title}</h3>
                                            <Badge className={cn("uppercase text-[10px] font-black h-6 px-3", exam.type === 'Exam' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{exam.type}</Badge>
                                            <Badge variant="outline" className="text-[10px] font-black border-white/10 opacity-50 px-3">{exam.status}</Badge>
                                        </div>
                                        <p className="text-base text-slate-400 font-medium mt-3 line-clamp-1 italic">"{exam.description || 'No internal description recorded.'}"</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-12 px-12 border-x border-white/5">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest opacity-50">Interaction Steps</p>
                                        <p className="text-3xl font-black text-white">{examQuestions.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest opacity-50">Session Velocity</p>
                                        <p className="text-3xl font-black text-white">{exam.timeLimitMinutes}m</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:row gap-3">
                                    <div className="flex items-center gap-2">
                                        {exam.status === 'Published' && (
                                            <>
                                                <Button 
                                                    variant={exam.isLive ? "destructive" : "outline"} 
                                                    className="rounded-full gap-2 font-black uppercase tracking-widest text-[10px] h-12 px-8 border-white/10 shadow-xl"
                                                    onClick={() => toggleLiveSession(exam)}
                                                >
                                                    {exam.isLive ? <><Square className="h-3 w-3 fill-current" /> Halt Broadcast</> : <><Play className="h-3 w-3 fill-current" /> Broadcast Live</>}
                                                </Button>
                                                {exam.isLive && (
                                                    <Button className="h-12 rounded-full gap-2 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg px-8" onClick={() => nextLiveQuestion(exam)}>
                                                        Push Next Question <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-12 w-12 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-full" asChild title="Big Screen Display">
                                                    <Link href={`/exam/display?id=${exam.id}`} target="_blank"><Monitor className="h-6 w-6" /></Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 justify-end">
                                        <Button variant="outline" className="h-10 rounded-full gap-2 font-black uppercase text-[9px] border-primary/20 text-primary hover:bg-primary/10" onClick={() => { 
                                            setCurrentExam(exam); 
                                            setIsQuestionModalOpen(true); 
                                            setQuestionForm({ examId: exam.id, questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1 }); 
                                        }}>
                                            <PlusCircle className="h-4 w-4" /> Add Question
                                        </Button>
                                        
                                        <Label htmlFor={`excel-up-${exam.id}`} className="cursor-pointer">
                                            <div className="h-10 px-4 flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-colors font-black uppercase text-[9px]">
                                                <FileSpreadsheet className="h-4 w-4" /> Bulk Upload
                                            </div>
                                            <Input id={`excel-up-${exam.id}`} type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleExcelUpload(e, exam.id)} />
                                        </Label>

                                        <div className="flex gap-1 ml-4">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 rounded-full" onClick={() => { setCurrentExam(exam); setExamForm({ ...exam }); setIsExamModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'arsExams', exam.id))}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logic Stream Reveal */}
                            {examQuestions.length > 0 && (
                                <div className="px-10 pb-10 animate-in slide-in-from-top-4 duration-500">
                                    <div className="bg-black/40 rounded-[32px] border border-white/5 divide-y divide-white/5 shadow-inner overflow-hidden">
                                        <div className="bg-white/5 px-6 py-3 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Logic Stream</span>
                                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase" onClick={handleDownloadTemplate}><Download className="h-3 w-3 mr-1" /> Template</Button>
                                        </div>
                                        {examQuestions.map((q, i) => (
                                            <div key={q.id} className="p-5 flex items-center justify-between group/q hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-xs font-black text-muted-foreground w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{i + 1}</span>
                                                    <div className="space-y-1">
                                                        <p className="text-base font-bold text-white/90">{q.questionText}</p>
                                                        <div className="flex gap-4">
                                                            {exam.type === 'Exam' && (
                                                                <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-500 font-black gap-1.5 uppercase tracking-tighter">
                                                                    <CheckCircle2 className="h-3 w-3" /> Valid Key: {q.correctOption}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-[9px] h-5 border-white/10 text-muted-foreground font-black uppercase tracking-tighter">
                                                                Weight: {q.points} pt
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 rounded-xl" onClick={() => { setCurrentExam(exam); setCurrentQuestion(q); setQuestionForm({ ...q }); setIsQuestionModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'arsQuestions', q.id))}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
                {exams.length === 0 && (
                    <div className="p-32 text-center border-4 border-dashed border-white/5 rounded-[60px] opacity-20">
                        <Radio className="h-32 w-32 mx-auto mb-6" />
                        <p className="text-2xl font-black uppercase tracking-[0.4em]">No Session Registries Detected</p>
                    </div>
                )}
            </div>

            {/* Session Registry Modal */}
            <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-slate-900 border-white/10 text-white rounded-[40px] animate-dialog-in p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight italic">Registry Configuration</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-medium">Define parameters for the evaluation or survey lifecycle.</DialogDescription>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Sparkles className="h-3 w-3" /> Session Identity</Label>
                                <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="bg-white/5 border-white/10 h-12 font-bold" placeholder="e.g. Q1 Operations Review" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Layers className="h-3 w-3" /> Registry Logic Mode</Label>
                                <Select value={examForm.type} onValueChange={v => setExamForm({...examForm, type: v as any})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="Exam">Graded Examination (Real Score)</SelectItem>
                                        <SelectItem value="Survey">Audience Survey (Sentiment)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Description</Label>
                            <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className="bg-white/5 border-white/10" placeholder="Internal memo regarding the purpose of this session..." rows={3} />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score Ceiling</Label>
                                <Input type="number" value={examForm.totalMarks} onChange={e => setExamForm({...examForm, totalMarks: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" disabled={examForm.type === 'Survey'} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Passing Benchmark</Label>
                                <Input type="number" value={examForm.passingMarks} onChange={e => setExamForm({...examForm, passingMarks: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" disabled={examForm.type === 'Survey'} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry Lifecycle</Label>
                                <Select value={examForm.status} onValueChange={v => setExamForm({...examForm, status: v as any})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="Draft">Draft (Private)</SelectItem>
                                        <SelectItem value="Published">Published (Public)</SelectItem>
                                        <SelectItem value="Archived">Archived (Closed)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <Button variant="ghost" onClick={() => setIsExamModalOpen(false)} className="text-white/60">Cancel</Button>
                        <Button onClick={handleSaveExam} className="h-14 px-12 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">Commit Registry</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Question Logic Modal */}
            <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
                <DialogContent className="sm:max-w-3xl bg-slate-900 border-white/10 text-white rounded-[40px] animate-dialog-in p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight italic">Interaction Logic Entry</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-medium">Define the core prompt and the 4-part response matrix.</DialogDescription>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">Question Prompt (Live Signal)</Label>
                            <Input value={questionForm.questionText} onChange={e => setQuestionForm({...questionForm, questionText: e.target.value})} className="bg-white/5 border-white/10 h-14 text-lg font-black" placeholder="e.g. What is the primary directive for Q1?" />
                        </div>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ListChecks className="h-3 w-3" /> Response Options Array</Label>
                                {questionForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-3 items-center group">
                                        <span className="h-10 w-10 flex items-center justify-center font-black text-primary bg-primary/10 rounded-xl group-focus-within:bg-primary group-focus-within:text-primary-foreground transition-all">{String.fromCharCode(65 + i)}</span>
                                        <Input value={opt} onChange={e => { const n = [...questionForm.options]; n[i] = e.target.value; setQuestionForm({...questionForm, options: n}); }} className="bg-white/5 border-white/10 h-10 text-sm font-bold" placeholder={`Option ${i+1}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signal Type</Label>
                                        <Select value={questionForm.type} onValueChange={v => setQuestionForm({...questionForm, type: v as any})}>
                                            <SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-white/10"><SelectItem value="MCQ">4-Way Multiple Choice</SelectItem><SelectItem value="True/False">Binary True/False</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    {currentExam?.type === 'Exam' && (
                                        <div className="space-y-2 p-4 border-2 border-dashed border-emerald-500/20 rounded-2xl bg-emerald-500/5 animate-in zoom-in-95">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Validation Key (Correct Answer)</Label>
                                            <Select value={questionForm.correctOption} onValueChange={v => setQuestionForm({...questionForm, correctOption: v})}>
                                                <SelectTrigger className="bg-background border-emerald-500/30 text-emerald-400 font-black h-10"><SelectValue placeholder="Identify correct response" /></SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10">
                                                    {questionForm.options.map((opt, i) => opt && <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}: {opt}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logic weightage (Points)</Label>
                                        <Input type="number" value={questionForm.points} onChange={e => setQuestionForm({...questionForm, points: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)} className="text-white/60">Cancel</Button>
                        <Button onClick={handleSaveQuestion} className="h-14 px-12 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">Inject Logic Pulse</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
