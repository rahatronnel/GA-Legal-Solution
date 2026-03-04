"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArs } from '../components/ars-provider';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BarChart2, Radio, Smartphone, History, Wifi, Timer, Clock, Hash, CheckCircle2, Play, ChevronRight, Check, XCircle, Trophy, Award, TrendingUp, Activity } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function SeminarDisplayPage() {
    const searchParams = useSearchParams();
    const examId = searchParams.get('id');
    const firestore = useFirestore();
    const { exams, questions, submissions, isLoading: isArsLoading } = useArs();

    const exam = useMemo(() => exams.find(e => e.id === examId), [exams, examId]);
    const activeQuestions = useMemo(() => questions.filter(q => q.examId === examId), [questions, examId]);
    const examSubmissions = useMemo(() => submissions.filter(s => s.examId === examId), [submissions, examId]);

    const currentQuestion = useMemo(() => {
        if (!exam || exam.activeQuestionIndex === -1) return null;
        return activeQuestions[exam.activeQuestionIndex];
    }, [exam, activeQuestions]);

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (currentQuestion) {
            setTimeLeft(currentQuestion.timeLimitSeconds || 30);
        }
    }, [exam?.activeQuestionIndex, currentQuestion]);

    useEffect(() => {
        if (!exam?.isLive || timeLeft <= 0 || !currentQuestion) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    autoAdvance();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, exam?.isLive, currentQuestion]);

    const autoAdvance = () => {
        if (!firestore || !exam) return;
        if (exam.activeQuestionIndex < activeQuestions.length - 1) {
            setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
                activeQuestionIndex: exam.activeQuestionIndex + 1 
            }, { merge: true });
        } else {
            handleEndSession();
        }
    };

    const handleStartExam = () => {
        if (!firestore || !exam || activeQuestions.length === 0) return;
        setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), {
            isLive: true,
            activeQuestionIndex: 0
        }, { merge: true });
    };

    const handleEndSession = () => {
        if (!firestore || !exam) return;
        setDocumentNonBlocking(doc(firestore, 'arsExams', exam.id), { 
            isLive: false,
            activeQuestionIndex: -1 
        }, { merge: true });
    };

    const responseStats = useMemo(() => {
        if (!currentQuestion) return [];
        const stats: Record<string, number> = {};
        currentQuestion.options.forEach(opt => stats[opt] = 0);
        
        examSubmissions.forEach(sub => {
            const answer = sub.answers[currentQuestion.id];
            if (answer && stats[answer] !== undefined) {
                stats[answer]++;
            }
        });

        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }, [currentQuestion, examSubmissions]);

    const joinUrl = useMemo(() => {
        if (typeof window === 'undefined' || !examId) return '';
        return `${window.location.origin}/exam/entry?examId=${examId}`;
    }, [examId]);

    if (isArsLoading || !exam) {
        return <div className="flex h-screen items-center justify-center bg-black"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] bg-primary/10 rounded-full blur-[150px] opacity-50" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] bg-blue-500/10 rounded-full blur-[150px] opacity-50" />

            <header className="flex justify-between items-center mb-12 relative z-10 border-b border-white/10 pb-6">
                <div className="flex items-center gap-6">
                    <Badge className="bg-primary/20 text-primary text-xl px-6 py-2 font-black uppercase tracking-widest">{exam.type}</Badge>
                    <h1 className="text-5xl font-black tracking-tighter leading-none uppercase italic">{exam.title}</h1>
                </div>
                <div className="flex gap-12">
                    <div className="flex flex-col items-end"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Boarded Registry</p><div className="flex items-center gap-2 text-3xl font-black"><Users className="h-6 w-6 text-primary" /> {examSubmissions.length}</div></div>
                    {exam.isLive && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-12 rounded-full font-black uppercase tracking-widest px-6 shadow-xl shadow-red-500/20"
                            onClick={handleEndSession}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> End Session
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 min-h-0">
                {/* Main Interaction Area */}
                <div className="lg:col-span-2 flex flex-col gap-8 min-h-0">
                    {!exam.isLive && exam.activeQuestionIndex === -1 && examSubmissions.length === 0 ? (
                        <div className="flex-1 p-8 bg-white/5 border border-white/10 rounded-[60px] flex flex-col gap-8 animate-in zoom-in-95 duration-1000 shadow-2xl shadow-primary/5 min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1 min-h-0">
                                <div className="flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="p-6 bg-white rounded-[40px] shadow-2xl">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`} alt="QR" className="w-48 h-48 lg:w-64 lg:h-64"/>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black uppercase tracking-tight italic text-primary leading-none">Sync Terminal</h2>
                                        <p className="text-sm text-slate-400 font-medium italic">Scan to board the session.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col h-full min-h-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" /> Personnel Boarded
                                        </h3>
                                        <Badge className="bg-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">{examSubmissions.length} Joined</Badge>
                                    </div>
                                    <ScrollArea className="flex-1 bg-white/[0.02] border border-white/10 rounded-[32px] p-4 relative">
                                        <div className="grid grid-cols-1 gap-2">
                                            {examSubmissions.map((sub) => (
                                                <div key={sub.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between animate-in slide-in-from-right-4 group hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-[10px] uppercase">{sub.participantName.charAt(0)}</div>
                                                        <div className="text-left">
                                                            <p className="text-xs font-black leading-none uppercase">{sub.participantName}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground mt-1">{sub.participantMobile}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                </div>
                                            ))}
                                            {examSubmissions.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 italic text-xs text-center space-y-2">
                                                    <Wifi className="h-8 w-8 animate-pulse text-primary" />
                                                    <p className="uppercase font-black tracking-widest">Waiting for signals...</p>
                                                </div>
                                            )}
                                        </div>
                                        <ScrollBar orientation="vertical" />
                                    </ScrollArea>
                                </div>
                            </div>
                            
                            <div className="flex justify-center shrink-0">
                                <Button 
                                    onClick={handleStartExam}
                                    className="h-16 px-16 rounded-full font-black uppercase tracking-widest text-xl shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-110 transition-all bg-primary text-primary-foreground border-4 border-white/20"
                                >
                                    <Play className="mr-4 h-6 w-6 fill-current" /> Start Seminar Exam
                                </Button>
                            </div>
                        </div>
                    ) : currentQuestion ? (
                        <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-bottom-12 duration-700 min-h-0">
                            <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/10">
                                <div className="space-y-1"><p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Signal Countdown</p><div className={cn("text-6xl font-black font-mono transition-colors", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-white")}>{timeLeft}s</div></div>
                                <div className="text-right space-y-1"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Current Question</p><div className="text-4xl font-black text-blue-400">{exam.activeQuestionIndex + 1} <span className="text-xl text-muted-foreground">/ {activeQuestions.length}</span></div></div>
                            </div>

                            <Card className="bg-white/5 border-white/10 rounded-[40px] p-10 flex flex-col justify-center gap-8 shadow-2xl">
                                <h2 className="text-5xl font-black tracking-tighter italic leading-none">{currentQuestion.questionText}</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    {currentQuestion.options.map((opt, i) => (
                                        <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl text-2xl font-bold flex items-center gap-6 transition-all hover:bg-white/10 group">
                                            <span className="h-12 w-12 bg-primary text-black rounded-full flex items-center justify-center font-black group-hover:scale-110 transition-transform">{String.fromCharCode(65 + i)}</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="bg-transparent border-white/10 rounded-[40px] overflow-hidden flex-1 min-h-[300px]">
                                <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-8"><CardTitle className="text-xs uppercase font-black tracking-widest flex items-center gap-2 text-primary"><BarChart2 className="h-4 w-4" /> Live Response Pulse Matrix</CardTitle></CardHeader>
                                <CardContent className="p-8 h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={responseStats}>
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide />
                                            <Bar dataKey="value" radius={[15, 15, 0, 0]} animationDuration={500}>
                                                {responseStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : '#3b82f6'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-8 bg-white/5 border border-white/10 rounded-[60px] animate-in fade-in duration-1000 min-h-0">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20"><Trophy className="h-10 w-10" /></div>
                                    <div><h2 className="text-4xl font-black uppercase italic tracking-tighter">Session Concluded</h2><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Final Performance Analysis Matrix</p></div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-right"><p className="text-[9px] font-black text-white/40 uppercase mb-1">Global Mean</p><p className="text-3xl font-black text-primary">{Math.round(examSubmissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / (examSubmissions.length || 1))}%</p></div>
                                    <div className="text-right"><p className="text-[9px] font-black text-white/40 uppercase mb-1">Total Personnel</p><p className="text-3xl font-black">{examSubmissions.length}</p></div>
                                </div>
                            </div>

                            <Card className="flex-1 min-h-0 bg-white/[0.02] border-white/10 rounded-[40px] overflow-hidden">
                                <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-8"><CardTitle className="text-xs uppercase font-black tracking-widest flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Official Registry Results</CardTitle></CardHeader>
                                <CardContent className="p-0 h-full overflow-hidden">
                                    <ScrollArea className="h-full">
                                        <Table>
                                            <TableHeader className="bg-white/[0.02] sticky top-0 z-20"><TableRow className="border-white/10"><TableHead className="text-[10px] font-black uppercase text-white/40 pl-8 h-12">Personnel Identity</TableHead><TableHead className="text-[10px] font-black uppercase text-white/40 text-center h-12">Score</TableHead><TableHead className="text-[10px] font-black uppercase text-white/40 text-center h-12">Accuracy</TableHead><TableHead className="text-[10px] font-black uppercase text-white/40 text-right pr-8 h-12">Validation</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {examSubmissions.sort((a,b) => (b.score || 0) - (a.score || 0)).map((sub) => (
                                                    <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                                        <TableCell className="pl-8 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">{sub.participantName.charAt(0)}</div>
                                                                <div className="text-left"><p className="text-sm font-black uppercase">{sub.participantName}</p><p className="text-[10px] font-bold text-muted-foreground">{sub.participantMobile}</p></div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center font-black text-lg">{sub.score || 0} <span className="text-[10px] text-white/20 uppercase tracking-widest">pts</span></TableCell>
                                                        <TableCell className="text-center font-black text-lg text-primary">{Math.round(sub.percentage || 0)}%</TableCell>
                                                        <TableCell className="text-right pr-8">
                                                            <Badge className={cn("text-[10px] font-black h-6 uppercase px-4 border-2 shadow-lg", sub.status === 'Passed' ? "bg-emerald-50/20 text-emerald-400 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30")}>{sub.status || 'Failed'}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {examSubmissions.length === 0 && (
                                                    <TableRow><TableCell colSpan={4} className="py-20 text-center opacity-20 italic uppercase font-black tracking-[0.2em]">Zero Signals Logged</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                        <ScrollBar orientation="vertical" />
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Live Participant Monitor (Feed always on the right) */}
                <div className="flex flex-col gap-8 min-h-0">
                    <Card className="bg-white/5 border-white/10 rounded-[40px] p-8 flex flex-col h-full overflow-hidden shadow-2xl">
                        <CardHeader className="p-0 pb-6 border-b border-white/10"><CardTitle className="text-sm uppercase font-black tracking-[0.2em] flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Live Signal Stream</CardTitle></CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden pt-6">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader><TableRow className="border-white/10"><TableHead className="text-[10px] font-black text-white/40 uppercase">Terminal</TableHead><TableHead className="text-[10px] font-black text-white/40 uppercase text-center">Efficiency</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {examSubmissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map((sub) => {
                                            const ansCount = Object.keys(sub.answers || {}).length;
                                            const isDone = ansCount === activeQuestions.length && activeQuestions.length > 0;
                                            return (
                                                <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02] group">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-black text-[10px]", isDone ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary/20 text-primary")}>{sub.participantName.charAt(0)}</div>
                                                            <div><p className="text-xs font-black truncate max-w-[120px] uppercase">{sub.participantName}</p><p className="text-[9px] font-bold text-muted-foreground">{sub.participantMobile}</p></div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[10px] font-black h-6 border-white/10 px-2", isDone ? "bg-emerald-50/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-white/60")}>{ansCount} / {activeQuestions.length}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {examSubmissions.length === 0 && (
                                            <TableRow><TableCell colSpan={2} className="py-20 text-center opacity-30 italic text-xs uppercase font-black tracking-widest">Waiting for signals...</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
