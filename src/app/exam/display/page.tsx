
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArs, type ArsExam, type ArsQuestion } from '../components/ars-provider';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Radio, Users, Timer, ChevronRight, BarChart2, ShieldCheck, GraduationCap, Smartphone, QrCode } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export default function SeminarDisplayPage() {
    const searchParams = useSearchParams();
    const examId = searchParams.get('id');
    const { exams, questions, submissions, isLoading: isArsLoading } = useArs();
    const firestore = useFirestore();

    const exam = useMemo(() => exams.find(e => e.id === examId), [exams, examId]);
    const activeQuestions = useMemo(() => questions.filter(q => q.examId === examId), [questions, examId]);
    const examSubmissions = useMemo(() => submissions.filter(s => s.examId === examId), [submissions, examId]);

    const currentQuestion = useMemo(() => {
        if (!exam || exam.activeQuestionIndex === -1) return null;
        return activeQuestions[exam.activeQuestionIndex];
    }, [exam, activeQuestions]);

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

    if (isArsLoading || !exam) {
        return <div className="flex h-screen items-center justify-center bg-black"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-black text-white p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] bg-primary/10 rounded-full blur-[150px] opacity-50" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] bg-blue-500/10 rounded-full blur-[150px] opacity-50" />

            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                
                {/* Main Interaction Area */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="space-y-4">
                        <Badge className="bg-primary/20 text-primary text-xl px-6 py-2 font-black uppercase tracking-widest">{exam.type}</Badge>
                        <h1 className="text-7xl font-black tracking-tighter leading-tight uppercase">{exam.title}</h1>
                        <div className="h-2 w-48 bg-primary rounded-full" />
                    </div>

                    {!exam.isLive && exam.activeQuestionIndex === -1 ? (
                        <div className="p-12 bg-white/5 border border-white/10 rounded-[60px] flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-1000">
                            <div className="p-8 bg-white rounded-[40px] shadow-2xl">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/exam/entry')}`}
                                    alt="QR Code"
                                    className="w-64 h-64"
                                />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase tracking-tight">Scan to Join Seminar</h2>
                                <p className="text-2xl text-slate-400 font-medium italic">Please enter your Name and Mobile Number after scanning.</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><span className="text-3xl font-black">{examSubmissions.length} Joined</span></div>
                                <div className="flex items-center gap-3"><Wifi className="h-8 w-8 text-primary animate-pulse" /><span className="text-3xl font-black">Live Pulse Active</span></div>
                            </div>
                        </div>
                    ) : currentQuestion ? (
                        <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-700">
                            <div className="space-y-6">
                                <h2 className="text-5xl font-black tracking-tight">{currentQuestion.questionText}</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    {currentQuestion.options.map((opt, i) => (
                                        <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl text-2xl font-bold flex items-center gap-6">
                                            <span className="h-12 w-12 bg-primary text-black rounded-full flex items-center justify-center font-black">{String.fromCharCode(65 + i)}</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Result Chart */}
                            <Card className="bg-transparent border-white/10 rounded-[40px] overflow-hidden">
                                <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-8"><CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Real-Time Response Matrix</CardTitle></CardHeader>
                                <CardContent className="p-8 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={responseStats}>
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
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
                        <div className="p-12 text-center space-y-8 animate-in fade-in duration-1000">
                            <h2 className="text-6xl font-black uppercase">Session Concluded</h2>
                            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-sm text-muted-foreground uppercase font-black">Total Participants</p>
                                    <p className="text-5xl font-black">{examSubmissions.length}</p>
                                </div>
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-sm text-muted-foreground uppercase font-black">Mean Accuracy</p>
                                    <p className="text-5xl font-black">{Math.round(examSubmissions.reduce((acc, s) => acc + s.percentage, 0) / (examSubmissions.length || 1))}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="bg-white/5 border-white/10 rounded-[40px] p-8 text-center space-y-6">
                        <Smartphone className="h-16 w-16 mx-auto text-primary" />
                        <h3 className="text-2xl font-black uppercase">Individual Terminals</h3>
                        <p className="text-slate-400 leading-relaxed">Respond directly from your smartphone browser.</p>
                        <div className="bg-white p-4 rounded-3xl inline-block">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/exam/entry')}`}
                                alt="Small QR"
                                className="w-32 h-32"
                            />
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2 px-2"><History className="h-3 w-3" /> Live Feed</h4>
                        <div className="space-y-3">
                            {examSubmissions.slice(-5).map((sub, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-[10px]">{sub.participantName.charAt(0)}</div>
                                        <span className="text-sm font-bold truncate max-w-[120px]">{sub.participantName}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase opacity-50">Boarded</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
