
'use client';

import React, { useMemo, useState } from 'react';
import { useArs, type ArsSubmission, type ArsQuestion } from '../components/ars-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    BarChart2, Globe, TrendingUp, Users, Award, 
    ShieldAlert, ChevronLeft, Trash2, Eye, 
    CheckCircle2, XCircle, FileText, Search,
    Info, ListOrdered, User, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * AnswerDetailModal - Displays a question-by-question diagnostic of a participant's submission.
 */
const AnswerDetailModal = ({ 
    sub, 
    isOpen, 
    onOpenChange, 
    questions 
}: { 
    sub: any | null, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void,
    questions: ArsQuestion[]
}) => {
    if (!sub) return null;

    const examQuestions = questions.filter(q => q.examId === sub.examId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden animate-dialog-in border-none shadow-2xl">
                <div className="bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-white/10 shadow-2xl">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">Answer Diagnostic</h1>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2 leading-none">Participant: {sub.participantName}</p>
                            </div>
                        </div>
                        <Badge className={cn("font-black uppercase text-[10px] tracking-widest px-4", sub.status === 'Passed' ? "bg-emerald-500 text-white" : "bg-destructive text-white")}>
                            {sub.status || 'UNRANKED'}
                        </Badge>
                    </div>
                    <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
                </div>

                <div className="flex-1 min-h-0 bg-muted/10 p-6">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-6">
                            {examQuestions.map((q, idx) => {
                                const userAnswer = sub.answers[q.id];
                                const isCorrect = userAnswer === q.correctOption;
                                
                                return (
                                    <Card key={q.id} className={cn(
                                        "border-l-8 transition-all hover:shadow-md",
                                        isCorrect ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-destructive bg-destructive/5"
                                    )}>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                        <Hash className="h-3 w-3" /> Question {idx + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold leading-tight">{q.questionText}</h4>
                                                </div>
                                                {isCorrect ? (
                                                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                                                ) : (
                                                    <XCircle className="h-6 w-6 text-destructive shrink-0" />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="p-3 rounded-xl bg-background/50 border">
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Submitted Signal</p>
                                                    <p className={cn(
                                                        "text-sm font-black italic",
                                                        isCorrect ? "text-emerald-600" : "text-destructive"
                                                    )}>
                                                        {userAnswer || "NO SIGNAL DETECTED"}
                                                    </p>
                                                </div>
                                                {!isCorrect && (
                                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                        <p className="text-[9px] font-black uppercase text-emerald-700 mb-1">Correct Validation Key</p>
                                                        <p className="text-sm font-black text-emerald-600 italic">{q.correctOption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <Button onClick={() => onOpenChange(false)} className="w-full font-black uppercase tracking-widest text-xs">Close Diagnostic</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ArsResultsPage() {
    const { exams, questions, submissions, isLoading } = useArs();
    const firestore = useFirestore();

    const [selectedSubForDetail, setSelectedSubForDetail] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const stats = useMemo(() => {
        const total = submissions.length;
        const passed = submissions.filter(s => s.status === 'Passed').length;
        const avgScore = total > 0 ? submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / total : 0;
        
        return { total, passed, failed: total - passed, avgScore };
    }, [submissions]);

    const enrichedSubmissions = useMemo(() => {
        return submissions.map(sub => {
            const examQuestions = questions.filter(q => q.examId === sub.examId);
            let right = 0;
            let wrong = 0;
            
            examQuestions.forEach(q => {
                const ans = sub.answers[q.id];
                if (ans === q.correctOption) right++;
                else if (ans) wrong++;
            });

            return {
                ...sub,
                rightCount: right,
                wrongCount: wrong,
                totalQ: examQuestions.length
            };
        });
    }, [submissions, questions]);

    const chartData = useMemo(() => {
        return exams.map(exam => ({
            name: exam.title.split(' ')[0],
            submissions: submissions.filter(s => s.examId === exam.id).length,
            avg: submissions.filter(s => s.examId === exam.id).reduce((acc, s) => acc + (s.percentage || 0), 0) / (submissions.filter(s => s.examId === exam.id).length || 1)
        }));
    }, [exams, submissions]);

    const handleViewDetail = (sub: any) => {
        setSelectedSubForDetail(sub);
        setIsDetailModalOpen(true);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Globe className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">Performance Analytics</h1>
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
                <Card className="lg:col-span-1 bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5">
                        <CardTitle className="text-lg font-black uppercase text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" /> Session Drift Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 h-[400px]">
                        <ChartContainer config={{}} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)'}} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)'}} />
                                    <RechartsTooltip content={<ChartTooltipContent />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden flex flex-col">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5">
                        <CardTitle className="text-lg font-black uppercase text-white flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-emerald-500" /> Participant Performance Registry
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Detailed Analytical Audit Trail</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="bg-white/[0.02] sticky top-0 z-20">
                                    <TableRow className="border-white/10">
                                        <TableHead className="text-[10px] font-black uppercase text-white/40 h-12 pl-6">Personnel</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-white/40 h-12 text-center">Signals (R/W)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-white/40 h-12 text-center">Score %</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-white/40 h-12 text-right pr-6">Diagnostics</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrichedSubmissions.sort((a,b) => (b.percentage || 0) - (a.percentage || 0)).map(sub => (
                                        <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">{sub.participantName.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{sub.participantName}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{sub.participantMobile}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center items-center gap-4">
                                                    <div className="text-center"><p className="text-[9px] font-black text-emerald-500 uppercase">Correct</p><p className="font-bold text-white leading-none">{sub.rightCount}</p></div>
                                                    <div className="text-center"><p className="text-[9px] font-black text-destructive uppercase">Wrong</p><p className="font-bold text-white leading-none">{sub.wrongCount}</p></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-black text-base text-primary">{Math.round(sub.percentage || 0)}%</span>
                                                    <Badge variant={sub.status === 'Passed' ? 'default' : 'destructive'} className="font-black text-[8px] h-4 uppercase px-2">{sub.status}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 rounded-full gap-2 font-black uppercase text-[9px] border-white/10 hover:bg-primary hover:text-primary-foreground"
                                                            onClick={() => handleViewDetail(sub)}
                                                        >
                                                            <Eye className="h-3 w-3" /> View Answers
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => firestore && deleteDocumentNonBlocking(doc(firestore, 'arsSubmissions', sub.id))}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {enrichedSubmissions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center opacity-30 italic text-xs uppercase font-black tracking-widest">Feed Registry Empty</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <AnswerDetailModal 
                isOpen={isDetailModalOpen} 
                onOpenChange={setIsDetailModalOpen} 
                sub={selectedSubForDetail} 
                questions={questions} 
            />
        </div>
    );
}
