
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArs, type ArsExam } from '../components/ars-provider';
import { useUser, useFirestore, addDocumentNonBlocking, initiateAnonymousSignIn, useAuth, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, GraduationCap, Home, UserCircle, Wifi, Clock } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const OptionPart = ({ opt, isSelected, id }: { opt: string, isSelected: boolean, id: string }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    useGSAP(() => {
        gsap.to(itemRef.current, { scale: isSelected ? 1.02 : 1, backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)', duration: 0.3, ease: "power2.out" });
    }, { dependencies: [isSelected] });

    return (
        <div ref={itemRef} className="group">
            <Label htmlFor={id} className={cn("flex items-center gap-4 p-6 rounded-[24px] border-2 cursor-pointer transition-all active:scale-[0.98]", isSelected ? "border-primary bg-primary/10 shadow-lg" : "border-white/5 bg-white/[0.02]")}>
                <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", isSelected ? "border-primary bg-primary" : "border-white/20")}>
                    {isSelected && <div className="h-2 w-2 bg-slate-950 rounded-full" />}
                </div>
                <span className={cn("text-lg font-bold tracking-tight", isSelected ? "text-white" : "text-white/60")}>{opt}</span>
                <RadioGroupItem value={opt} id={id} className="sr-only" />
            </Label>
        </div>
    );
};

export default function ArsEntryPage() {
    const searchParams = useSearchParams();
    const urlExamId = searchParams.get('examId');
    
    const { exams, questions, isLoading } = useArs();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    const [selectedExam, setSelectedExam] = useState<ArsExam | null>(null);
    const [participantName, setParticipantName] = useState('');
    const [participantMobile, setParticipantMobile] = useState('');
    const [isBoarded, setIsBoarded] = useState(false);
    const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
    
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [finalResult, setFinalResult] = useState<any>(null);

    // Auto-detect exam from URL
    useEffect(() => {
        if (!isLoading && urlExamId && !selectedExam) {
            const matched = exams.find(e => e.id === urlExamId);
            if (matched) setSelectedExam(matched);
        }
    }, [isLoading, urlExamId, exams, selectedExam]);

    // Track live status of the exam
    const liveExam = useMemo(() => {
        if (!selectedExam) return null;
        return exams.find(e => e.id === selectedExam.id);
    }, [exams, selectedExam]);

    const activeQuestions = useMemo(() => 
        questions.filter(q => q.examId === selectedExam?.id), 
    [questions, selectedExam]);

    const currentQuestion = useMemo(() => {
        if (!liveExam || liveExam.activeQuestionIndex === -1) return null;
        return activeQuestions[liveExam.activeQuestionIndex];
    }, [liveExam, activeQuestions]);

    const handleBoarding = async () => {
        if (!participantName || !participantMobile || !selectedExam || !firestore) return;
        
        // Ensure anonymous sign-in
        if (!user) {
            initiateAnonymousSignIn(auth!);
            return; // Wait for auth state change
        }

        const submissionData = {
            examId: selectedExam.id,
            userId: user.uid,
            participantName,
            participantMobile,
            answers: {},
            score: 0,
            percentage: 0,
            status: 'Failed',
            submittedAt: new Date().toISOString()
        };

        const docRef = await addDocumentNonBlocking(collection(firestore, 'arsSubmissions'), submissionData);
        if (docRef) setCurrentSubmissionId(docRef.id);
        setIsBoarded(true);
    };

    const handleAnswerSubmit = (value: string) => {
        if (!currentQuestion || !currentSubmissionId || !firestore) return;
        
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // Real-time synchronization: Push answer to the server immediately
        setDocumentNonBlocking(doc(firestore, 'arsSubmissions', currentSubmissionId), {
            answers: newAnswers,
            submittedAt: new Date().toISOString()
        }, { merge: true });
    };

    const finalizeSubmission = () => {
        if (!selectedExam || !currentSubmissionId || !firestore) return;

        let score = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id] === q.correctOption) score += q.points;
        });

        const percentage = (score / (selectedExam.totalMarks || 1)) * 100;
        const status = score >= selectedExam.passingMarks ? 'Passed' : 'Failed';

        const finalData = {
            score,
            percentage,
            status,
            submittedAt: new Date().toISOString()
        };

        setDocumentNonBlocking(doc(firestore, 'arsSubmissions', currentSubmissionId), finalData, { merge: true });
        setFinalResult({ ...finalData, participantName });
        setIsFinished(true);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (isFinished) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950">
                <Card className="max-w-md w-full bg-white/5 border-none rounded-[40px] overflow-hidden text-center text-white">
                    <div className={cn("p-12", finalResult.status === 'Passed' ? "bg-emerald-600" : "bg-destructive")}>
                        <CheckCircle2 className="h-20 w-20 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase italic">Registry Logged</h2>
                        <p className="text-sm opacity-80 mt-2">Thank you, {participantName}. Your responses have been synchronized.</p>
                    </div>
                    <CardContent className="p-8"><Button className="w-full h-14 rounded-full font-black uppercase" asChild><Link href="/"><Home className="mr-2 h-5 w-5" /> Home</Link></Button></CardContent>
                </Card>
            </div>
        );
    }

    if (!selectedExam) {
        return (
            <div className="min-h-screen p-8 bg-slate-950">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-[20px] border border-white/10 shadow-2xl"><GraduationCap className="h-8 w-8 text-primary" /></div>
                        <div><h1 className="text-4xl font-black uppercase text-white leading-none">ARS Registry</h1><p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Join an Active Session</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {exams.filter(e => e.status === 'Published').map(exam => (
                            <Card key={exam.id} className="group bg-white/[0.02] border-white/5 hover:border-primary/40 transition-all rounded-[32px] cursor-pointer overflow-hidden" onClick={() => setSelectedExam(exam)}>
                                <CardHeader className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className="bg-primary/10 text-primary">{exam.type}</Badge>
                                        {exam.isLive && <Badge className="bg-red-500 animate-pulse text-white font-black">LIVE</Badge>}
                                    </div>
                                    <CardTitle className="text-2xl font-black text-white">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isBoarded) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
                <Card className="max-w-md w-full bg-white/5 border-white/10 rounded-[40px] text-white shadow-2xl ring-1 ring-white/10">
                    <CardHeader className="p-8 text-center border-b border-white/5">
                        <UserCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Boarding Session</CardTitle>
                        <CardDescription className="font-bold text-slate-400">{selectedExam.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Participant Name</Label>
                            <Input value={participantName} onChange={e => setParticipantName(e.target.value)} className="bg-white/5 border-white/10 h-12 text-lg font-bold" placeholder="Your Name" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mobile Number</Label>
                            <Input value={participantMobile} onChange={e => setParticipantMobile(e.target.value)} className="bg-white/5 border-white/10 h-12 text-lg font-bold" placeholder="+880..." />
                        </div>
                        <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleBoarding} disabled={!participantName || !participantMobile}>Sync & Board Terminal</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!liveExam?.isLive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-8">
                <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse shadow-2xl"><Wifi className="h-10 w-10 text-primary" /></div>
                <div className="space-y-2"><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Waiting for Signal...</h2><p className="text-slate-400 font-medium">Hello {participantName}. The moderator will push the first question shortly.</p></div>
                <Badge variant="outline" className="border-white/10 text-muted-foreground px-4 py-1">Connection: Locked</Badge>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-8">
                <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
                <div className="space-y-2"><h2 className="text-3xl font-black text-white uppercase tracking-tighter">All Signals Logged</h2><p className="text-slate-400 font-medium">Please wait for the moderator to conclude the session.</p></div>
                <Button className="rounded-full px-8 h-12 font-black uppercase tracking-widest" variant="outline" onClick={finalizeSubmission}>Finalize My Results</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
            <div className="max-w-xl w-full space-y-8">
                <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-primary/10 text-primary uppercase font-black tracking-widest text-[9px]">Signal {liveExam.activeQuestionIndex + 1} of {activeQuestions.length}</Badge>
                    <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500 animate-ping" /><span className="text-[10px] font-black uppercase text-red-500">Live Feedback Window</span></div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tighter leading-none">{currentQuestion.questionText}</h2>
                <div className="h-1.5 w-24 bg-primary rounded-full" />

                <RadioGroup value={answers[currentQuestion.id] || ''} onValueChange={handleAnswerSubmit} className="grid gap-4 mt-8">
                    {currentQuestion.options.map((opt, i) => (
                        <OptionPart key={i} opt={opt} isSelected={answers[currentQuestion.id] === opt} id={`o-${i}`} />
                    ))}
                </RadioGroup>

                <div className="flex justify-center pt-8"><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2"><Clock className="h-3 w-3" /> Monitor screen for window countdown</p></div>
            </div>
        </div>
    );
}
