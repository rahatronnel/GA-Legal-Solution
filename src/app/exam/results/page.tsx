'use client';

import React, { useMemo } from 'react';
import { useArs } from '../components/ars-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart2, Globe, TrendingUp, Users, Award, ShieldAlert, Home, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ArsResultsPage() {
    const { exams, submissions, isLoading } = useArs();
    const firestore = useFirestore();

    const stats = useMemo(() => {
        const total = submissions.length;
        const passed = submissions.filter(s => s.status === 'Passed').length;
        const avgScore = total > 0 ? submissions.reduce((acc, s) => acc + s.percentage, 0) / total : 0;
        
        return { total, passed, failed: total - passed, avgScore };
    }, [submissions]);

    const chartData = useMemo(() => {
        return exams.map(exam => ({
            name: exam.title.split(' ')[0],
            submissions: submissions.filter(s => s.examId === exam.id).length,
            avg: submissions.filter(s => s.examId === exam.id).reduce((acc, s) => acc + s.percentage, 0) / (submissions.filter(s => s.examId === exam.id).length || 1)
        }));
    }, [exams, submissions]);

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black min-h-screen">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Globe className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">ARS Performance Analytics</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Cloud-Synchronized Organizational Metrics</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-full h-12 px-6 font-black uppercase tracking-widest bg-red-600/20 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white"
                        onClick={() => {
                            if (confirm('Wipe ALL results from the performance registry?')) {
                                submissions.forEach(s => deleteDocumentNonBlocking(doc(firestore!, 'arsSubmissions', s.id)));
                            }
                        }}
                    >
                        Clear Registry
                    </Button>
                    <Button variant="ghost" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild>
                        <Link href="/exam"><ChevronLeft className="h-5 w-5" /> Hub Console</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3" /> Total Responses</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-white">{stats.total}</div></CardContent>
                </Card>
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2"><Award className="h-3 w-3 text-emerald-500" /> Qualification Rate</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-emerald-500">{Math.round((stats.passed / (stats.total || 1)) * 100)}%</div></CardContent>
                </Card>
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2"><TrendingUp className="h-3 w-3 text-blue-500" /> Mean Accuracy</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-blue-500">{Math.round(stats.avgScore)}%</div></CardContent>
                </Card>
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-3 w-3 text-destructive" /> Critical failures</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-destructive">{stats.failed}</div></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-lg font-black uppercase text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Session Drift Analysis</CardTitle></CardHeader>
                    <CardContent className="pt-8 h-[400px]">
                        <ChartContainer config={{}} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)'}} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)'}} />
                                    <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-lg font-black uppercase text-white flex items-center gap-2"><BarChart2 className="h-5 w-5 text-emerald-500" /> Live Feed</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {submissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(sub => {
                                const exam = exams.find(e => e.id === sub.examId);
                                return (
                                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{exam?.title}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{sub.participantName} • {new Date(sub.submittedAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={sub.status === 'Passed' ? 'default' : 'destructive'} className="font-black text-[9px] h-5 uppercase tracking-tighter">{sub.status}</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => firestore && deleteDocumentNonBlocking(doc(firestore, 'arsSubmissions', sub.id))}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {submissions.length === 0 && <div className="p-12 text-center opacity-30 italic text-xs uppercase font-black tracking-widest">Feed Empty</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
