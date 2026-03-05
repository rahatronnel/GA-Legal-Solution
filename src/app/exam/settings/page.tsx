"use client";

import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArs, type ArsExam, type ArsQuestion } from '../components/ars-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, PlusCircle, Trash2, Edit, X, 
    Layers, Hash, CheckCircle2, ChevronLeft,
    Play, Square, ChevronRight, Monitor, ListChecks, HelpCircle, Radio, Sparkles,
    Download, FileSpreadsheet, Cpu, Plus, ClipboardList, Timer, RefreshCcw
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
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'entry';
    const isBroadcastMode = mode === 'broadcast';

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
    const [questionForm, setQuestionForm] = useState<Omit<ArsQuestion, 'id'>>({ examId: '', questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1, timeLimitSeconds: 30 });

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

    const visibleExams = isBroadcastMode ? exams.filter(e => e.status === 'Published') : exams;

    const handleSaveExam = () => {
        if (!firestore || !user) return;
        const data = { ...examForm, createdBy: user.uid, createdAt: new Date().toISOString() };
        if (currentExam?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', currentExam.id), data, { merge: true });
            toast({ title: 'Registry Updated' });
        } else {
            addDocumentNonBlocking(collection(firestore, 'arsExams'), { ...data, isLive: false, activeQuestionIndex: -1 });
            toast({ title: 'New Session Created' });
        }
        setIsExamModalOpen(false);
    };

    const handleSaveQuestion = () => {
        if (!firestore || !currentExam) return;
        const data = { ...questionForm, examId: currentExam.id };
        if (currentQuestion?.id) {
            setDocumentNonBlocking(doc(firestore, 'arsQuestions', currentQuestion.id), data, { merge: true });
            toast({ title: 'Question Updated' });
        } else {
            addDocumentNonBlocking(collection(firestore, 'arsQuestions'), data);
            toast({ title: 'Question Added' });
        }
        setIsQuestionModalOpen(false);
    };

    const handleDownloadTemplate = () => {
        const wsData = [{ questionText: "Sample?", type: "MCQ", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: "A", points: 10, timeLimitSeconds: 30 }];
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Questions");
        XLSX.writeFile(wb, "ARS_Template.xlsx");
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>, examId: string) => {
        const file = e.target.files?.[0];
        if (!file || !firestore) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];
                json.forEach(row => {
                    addDocumentNonBlocking(collection(firestore, 'arsQuestions'), {
                        examId,
                        questionText: String(row.questionText || ''),
                        type: (row.type === 'True/False' ? 'True/False' : 'MCQ'),
                        options: [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
                        correctOption: String(row.correctOption || ''),
                        points: Number(row.points) || 1,
                        timeLimitSeconds: Number(row.timeLimitSeconds) || 30
                    });
                });
                toast({ title: "Bulk Upload Success" });
            } catch (err) { toast({ variant: "destructive", title: "Upload Failed" }); }
        };
        reader.readAsArrayBuffer(file);
    };

    const toggleLiveSession = async (exam: ArsExam) => {
        if (!firestore) return;
        if (exam.isLive) {
            // End session manually
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                isLive: false,
                // Keep index at current to show results
                activeQuestionIndex: exam.activeQuestionIndex === -1 ? 0 : exam.activeQuestionIndex
            }, { merge: true });
            toast({ title: "Seminar Halted", description: "Analytical Conclusion View active." });
        } else {
            // Reset to Boarding Phase (QR Code)
            // NEW: Delete all previous submissions for this exam to start fresh
            try {
                const subsQuery = query(collection(firestore, 'arsSubmissions'), where('examId', '==', exam.id));
                const snapshot = await getDocs(subsQuery);
                snapshot.docs.forEach(s => deleteDocumentNonBlocking(s.ref));
            } catch (err) {
                console.error("Boarding cleanup failure:", err);
            }

            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                isLive: false, 
                activeQuestionIndex: -1 
            }, { merge: true });
            toast({ title: "Seminar Initialized", description: "Boarding phase active. Previous participants cleared." });
        }
    };

    const nextLiveQuestion = (exam: ArsExam) => {
        if (!firestore) return;
        const examQuestions = questions.filter(q => q.examId === exam.id);
        if (exam.activeQuestionIndex < examQuestions.length - 1) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                activeQuestionIndex: exam.activeQuestionIndex + 1 
            }, { merge: true });
        } else {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { isLive: false }, { merge: true });
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-50" ref={containerRef}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 border-b border-white/5 bg-white/[0.02] rounded-[32px]">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl", isBroadcastMode ? "bg-emerald-500/10" : "bg-primary/10")}>
                        {isBroadcastMode ? <Play className="h-8 w-8 text-emerald-500 animate-pulse" /> : <ClipboardList className="h-8 w-8 text-primary" />}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
                            {isBroadcastMode ? 'Broadcast Control' : 'Entry Registry'}
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 italic">Seminar Engine Management</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild><Link href="/exam"><ChevronLeft className="h-5 w-5" /> ARS Hub</Link></Button>
                    {!isBroadcastMode && (
                        <Button className="h-14 rounded-full font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 bg-primary text-primary-foreground hover:scale-105 px-10 border-4 border-white/10" onClick={() => { setCurrentExam(null); setExamForm({ title: '', description: '', totalMarks: 100, passingMarks: 50, timeLimitMinutes: 10, status: 'Draft', type: 'Exam' }); setIsExamModalOpen(true); }}>
                            <Plus className="h-6 w-6" /> Register New Session
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {visibleExams.map(exam => {
                    const examQuestions = questions.filter(q => q.examId === exam.id);
                    const isBoarding = !exam.isLive && exam.activeQuestionIndex === -1;
                    
                    return (
                        <Card key={exam.id} className="bg-white/[0.02] border-white/10 rounded-[40px] overflow-hidden group ars-card-animate hover:bg-white/[0.04] transition-all relative shadow-2xl">
                            <div className="p-10 flex flex-col items-center justify-between gap-8 lg:flex-row border-b border-white/5">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-6 transition-transform">
                                        <Layers className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{exam.title}</h3>
                                            <Badge className={cn("uppercase text-[10px] font-black h-6 px-3", exam.type === 'Exam' ? "bg-blue-50/20 text-blue-400" : "bg-purple-50/20 text-purple-400")}>{exam.type}</Badge>
                                            <Badge variant="outline" className="text-[10px] font-black border-white/10 opacity-50 px-3">{exam.status}</Badge>
                                        </div>
                                        <p className="text-base text-slate-400 font-medium mt-1 line-clamp-1 italic opacity-70">"{exam.description || 'No memo.'}"</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-w-[220px]">
                                    {!isBroadcastMode && (
                                        <Button variant="ghost" className="h-10 rounded-full gap-2 font-black uppercase text-[10px] bg-white/5 hover:bg-white/10" onClick={() => { setCurrentExam(exam); setExamForm({ ...exam }); setIsExamModalOpen(true); }}><Edit className="h-4 w-4" /> Edit Parameters</Button>
                                    )}
                                    {isBroadcastMode && (
                                        <div className="space-y-3 w-full">
                                            <Button 
                                                variant={exam.isLive ? "destructive" : "default"} 
                                                className={cn("w-full h-14 rounded-full gap-3 font-black uppercase tracking-widest text-xs shadow-xl", isBoarding ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700")}
                                                onClick={() => toggleLiveSession(exam)}
                                            >
                                                {isBoarding ? <><RefreshCcw className="h-4 w-4" /> Boarding Mode</> : exam.isLive ? <><Square className="h-4 w-4 fill-current" /> Halt Broadcast</> : <><Play className="h-4 w-4 fill-current" /> Reset to Boarding</>}
                                            </Button>
                                            
                                            <div className="space-y-2">
                                                {exam.isLive && (
                                                    <Button className="w-full h-12 rounded-full gap-2 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700" onClick={() => nextLiveQuestion(exam)}>Push Next Question <ChevronRight className="h-4 w-4" /></Button>
                                                )}
                                                <Button variant="ghost" className="w-full h-10 rounded-full gap-2 text-blue-400 bg-blue-500/10 font-black uppercase text-[9px]" asChild>
                                                    <Link href={`/exam/display?id=${exam.id}`} target="_blank"><Monitor className="h-4 w-4 mr-1" /> Open Seminar Screen</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isBroadcastMode && (
                                <div className="bg-black/20 p-10 space-y-8">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1"><h4 className="text-xl font-black uppercase tracking-tight text-primary">Logic Injection</h4></div>
                                        <div className="flex gap-4">
                                            <Button className="h-14 rounded-full gap-3 font-black uppercase tracking-widest text-[11px] px-8 bg-blue-600 border-4 border-white/10" onClick={() => { setCurrentExam(exam); setIsQuestionModalOpen(true); setQuestionForm({ examId: exam.id, questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOption: '', points: 1, timeLimitSeconds: 30 }); }}>
                                                <PlusCircle className="h-5 w-5" /> Manual Entry
                                            </Button>
                                            <div className="flex flex-col items-center gap-2">
                                                <Label htmlFor={`excel-up-${exam.id}`} className="cursor-pointer"><div className="h-14 px-8 flex items-center justify-center gap-3 text-emerald-400 bg-emerald-500/10 rounded-full font-black uppercase text-[11px] border-2 border-dashed border-emerald-500/30"><FileSpreadsheet className="h-5 w-5" /> Bulk Upload</div><Input id={`excel-up-${exam.id}`} type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleExcelUpload(e, exam.id)} /></Label>
                                                <Button variant="link" size="sm" className="h-4 text-[9px] font-black uppercase text-muted-foreground opacity-50" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-[32px] border border-white/5 divide-y divide-white/5 overflow-hidden">
                                        {examQuestions.length > 0 ? examQuestions.map((q, i) => (
                                            <div key={q.id} className="p-5 flex items-center justify-between group/q hover:bg-white/[0.02]">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-xs font-black text-muted-foreground w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{i + 1}</span>
                                                    <div className="space-y-1">
                                                        <p className="text-base font-bold text-white/90">{q.questionText}</p>
                                                        <div className="flex gap-4">
                                                            <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-500 font-black uppercase tracking-tighter"><Timer className="h-3 w-3 mr-1" /> {q.timeLimitSeconds}s Window</Badge>
                                                            <Badge variant="outline" className="text-[9px] h-5 border-white/10 text-muted-foreground font-black uppercase tracking-tighter">Weight: {q.points}pt</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 rounded-xl" onClick={() => { setCurrentExam(exam); setCurrentQuestion(q); setQuestionForm({ ...q }); setIsQuestionModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive rounded-xl" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'arsQuestions', q.id))}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        )) : <div className="p-20 text-center opacity-30"><Cpu className="h-16 w-16 mx-auto mb-4 animate-pulse" /><p className="text-sm font-black uppercase tracking-[0.2em]">Logic Registry Empty</p></div>}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-slate-900 border-white/10 text-white rounded-[40px] p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 bg-primary text-primary-foreground"><DialogTitle className="text-3xl font-black uppercase italic">Seminar Registry</DialogTitle></div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Identity</Label><Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="bg-white/5 border-white/10 h-12 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logic Mode</Label><Select value={examForm.type} onValueChange={v => setExamForm({...examForm, type: v as any})}><SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Exam">Graded Exam</SelectItem><SelectItem value="Survey">Audience Survey</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label><Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className="bg-white/5 border-white/10" rows={3} /></div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score Ceiling</Label><Input type="number" value={examForm.totalMarks} onChange={e => setExamForm({...examForm, totalMarks: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Benchmark</Label><Input type="number" value={examForm.passingMarks} onChange={e => setExamForm({...examForm, passingMarks: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifecycle</Label><Select value={examForm.status} onValueChange={v => setExamForm({...examForm, status: v as any})}><SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem><SelectItem value="Archived">Archived</SelectItem></SelectContent></Select></div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02]"><Button variant="ghost" onClick={() => setIsExamModalOpen(false)} className="text-white/60">Cancel</Button><Button onClick={handleSaveExam} className="h-14 px-12 font-black uppercase tracking-widest text-[11px] shadow-xl">Commit Registry</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
                <DialogContent className="sm:max-w-3xl bg-slate-900 border-white/10 text-white rounded-[40px] p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 bg-primary text-primary-foreground"><DialogTitle className="text-3xl font-black uppercase italic">Interaction Logic Entry</DialogTitle></div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question Prompt</Label><Input value={questionForm.questionText} onChange={e => setQuestionForm({...questionForm, questionText: e.target.value})} className="bg-white/5 border-white/10 h-14 text-lg font-black" /></div>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Matrix</Label>
                                {questionForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-3 items-center"><span className="h-10 w-10 flex items-center justify-center font-black text-primary bg-primary/10 rounded-xl">{String.fromCharCode(65 + i)}</span><Input value={opt} onChange={e => { const n = [...questionForm.options]; n[i] = e.target.value; setQuestionForm({...questionForm, options: n}); }} className="bg-white/5 border-white/10 h-10 text-sm font-bold" /></div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Validation Key (Correct Answer)</Label><Select value={questionForm.correctOption} onValueChange={v => setQuestionForm({...questionForm, correctOption: v})}><SelectTrigger className="bg-background border-emerald-500/30 text-emerald-400 font-black h-10"><SelectValue placeholder="Identify correct response" /></SelectTrigger><SelectContent>{questionForm.options.map((opt, i) => opt && <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}: {opt}</SelectItem>)}</SelectContent></Select></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weight (Pts)</Label><Input type="number" value={questionForm.points} onChange={e => setQuestionForm({...questionForm, points: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1"><Timer className="h-3 w-3" /> Timer (Sec)</Label><Input type="number" value={questionForm.timeLimitSeconds} onChange={e => setQuestionForm({...questionForm, timeLimitSeconds: Number(e.target.value)})} className="bg-white/5 border-white/10 h-12 font-bold" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02]"><Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)} className="text-white/60">Cancel</Button><Button onClick={handleSaveQuestion} className="h-14 px-12 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">Inject Logic Pulse</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
