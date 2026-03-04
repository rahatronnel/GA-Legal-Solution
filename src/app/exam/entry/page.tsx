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
import { CheckCircle2, GraduationCap, Home, UserCircle, Wifi, Clock, Timer, Trophy, Star, TrendingUp } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const OptionPart = ({ opt, isSelected, id, disabled }: { opt: string, isSelected: boolean, id: string, disabled: boolean }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    useGSAP(() => {
        gsap.to(itemRef.current, { scale: isSelected ? 1.02 : 1, backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)', duration: 0.3, ease: "power2.out" });
    }, { dependencies: [isSelected] });

    return (
        <div ref={itemRef} className={cn("group transition-opacity", disabled && !isSelected && "opacity-50")}>
            <Label htmlFor={id} className={cn("flex items-center gap-4 p-6 rounded-[24px] border-2 cursor-pointer transition-all active:scale-[0.98]", isSelected ? "border-primary bg-primary/10 shadow-lg" : "border-white/5 bg-white/[0.02]", disabled && "pointer-events-none")}>
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
    
    const { exams, questions, submissions, isLoading: isDataLoading } = useArs();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    const [selectedExam, setSelectedExam] = useState<ArsExam | null>(null);
    const [participantName, setParticipantName] = useState('');
    const [participantMobile, setParticipantMobile] = useState('');
    const [isBoarded, setIsBoarded] = useState(false);
    const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
    const [isBoardingLoading, setIsBoardingLoading] = useState(false);
    
    const [localAnswers, setAnswers] = useState<Record<string, string>>({});
    const [isSignalCommitted, setIsSignalCommitted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [finalResult, setFinalResult] = useState<any>(null);

    // Timer logic
    const [timeLeft, setTimeLeft] = useState(0);

    // 0. Handshake
    useEffect(() => {
        if (!user && !isUserLoading && auth) {
            initiateAnonymousSignIn(auth);
        }
    }, [user, isUserLoading, auth]);

    // 1. Auto-detect
    useEffect(() => {
        if (!isDataLoading && urlExamId && !selectedExam) {
            const matched = exams.find(e => e.id === urlExamId);
            if (matched) setSelectedExam(matched);
        }
    }, [isDataLoading, urlExamId, exams, selectedExam]);

    // 2. Persistent Resumption
    const userSubmission = useMemo(() => {
        if (!user || !submissions || !selectedExam) return null;
        return submissions.find(s => s.examId === selectedExam.id && s.userId === user.uid);
    }, [submissions, selectedExam, user]);

    useEffect(() => {
        if (userSubmission && !isBoarded) {
            setIsBoarded(true);
            setParticipantName(userSubmission.participantName);
            setParticipantMobile(userSubmission.participantMobile);
            setCurrentSubmissionId(userSubmission.id);
            setAnswers(userSubmission.answers || {});
            
            // If the session was already over, show results
            const matchedExam = exams.find(e => e.id === selectedExam?.id);
            if (matchedExam && !matchedExam.isLive && matchedExam.activeQuestionIndex === -1 && Object.keys(userSubmission.answers || {}).length > 0) {
                setFinalResult(userSubmission);
                setIsFinished(true);
            }
        }
    }, [userSubmission, isBoarded, exams, selectedExam]);

    // 3. Live Status Tracking
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

    // Reset signal commitment when question changes
    useEffect(() => {
        setIsSignalCommitted(false);
    }, [liveExam?.activeQuestionIndex]);

    // 4. Timer Pulse
    useEffect(() => {
        if (currentQuestion) {
            setTimeLeft(currentQuestion.timeLimitSeconds || 30);
        }
    }, [liveExam?.activeQuestionIndex, currentQuestion?.id]);

    useEffect(() => {
        if (!liveExam?.isLive || timeLeft <= 0 || !currentQuestion) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, liveExam?.isLive, currentQuestion]);

    // Auto-calculate results when session concludes
    useEffect(() => {
        if (isBoarded && liveExam && !liveExam.isLive && liveExam.activeQuestionIndex === -1 && !isFinished) {
            finalizeSubmission();
        }
    }, [liveExam?.isLive, isBoarded]);

    const handleBoarding = async () => {
        if (!participantName || !participantMobile || !selectedExam || !firestore || !user) return;
        
        setIsBoardingLoading(true);

        try {
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
        } catch (err) {
            console.error("Boarding failure:", err);
        } finally {
            setIsBoardingLoading(false);
        }
    };

    const handleAnswerSubmit = (value: string) => {
        if (!currentQuestion || !currentSubmissionId || !firestore || isSignalCommitted) return;
        
        const newAnswers = { ...localAnswers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        setDocumentNonBlocking(doc(firestore, 'arsSubmissions', currentSubmissionId), {
            answers: newAnswers,
            submittedAt: new Date().toISOString()
        }, { merge: true });
    };

    const handleCommitSignal = () => {
        setIsSignalCommitted(true);
    };

    const finalizeSubmission = () => {
        if (!selectedExam || !currentSubmissionId || !firestore) return;

        let score = 0;
        activeQuestions.forEach(q => {
            if (localAnswers[q.id] === q.correctOption) score += q.points;
        });

        const totalPoints = activeQuestions.reduce((acc, q) => acc + (q.points || 1), 0);
        const percentage = (score / (totalPoints || 1)) * 100;
        const status = score >= (selectedExam.passingMarks || 0) ? 'Passed' : 'Failed';

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

    if (isDataLoading || isUserLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (isFinished && finalResult) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] h-[400px] w-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
                
                <Card className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[40px] overflow-hidden text-center text-white shadow-2xl relative z-10 backdrop-blur-xl">
                    <div className={cn("p-12 relative overflow-hidden", finalResult.status === 'Passed' ? "bg-emerald-600/20" : "bg-destructive/20")}>
                        <div className="relative z-10">
                            {finalResult.status === 'Passed' ? <Trophy className="h-20 w-20 mx-auto mb-4 text-emerald-400" /> : <XCircle className="h-20 w-20 mx-auto mb-4 text-destructive" />}
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Results Logged</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 italic">Performance Analytics Finalized</p>
                        </div>
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center scale-150 rotate-12"><GraduationCap className="h-64 w-64" /></div>
                    </div>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Score Registry</p>
                                <div className="text-2xl font-black flex items-center justify-center gap-1">{finalResult.score} <span className="text-[10px] text-white/20">pts</span></div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Accuracy</p>
                                <div className="text-2xl font-black text-primary">{Math.round(finalResult.percentage)}%</div>
                            </div>
                        </div>
                        <div className="p-6 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[32px] text-left">
                            <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mb-2"><CheckCircle2 className="h-3 w-3 text-primary" /> Verification Memo</p>
                            <p className="text-sm font-medium leading-relaxed italic text-slate-300">
                                &quot;Hello {participantName}, your assessment signal has been successfully hard-locked into the organizational performance matrix.&quot;
                            </p>
                        </div>
                        <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20 border-4 border-white/10" asChild><Link href="/"><Home className="mr-2 h-5 w-5" /> Back to Dashboard</Link></Button>
                    </CardContent>
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
                                        <Badge className="bg-primary/10 text-primary uppercase font-black text-[9px]">{exam.type}</Badge>
                                        {exam.isLive && <Badge className="bg-red-500 animate-pulse text-white font-black text-[9px]">LIVE</Badge>}
                                    </div>
                                    <CardTitle className="text-2xl font-black text-white uppercase">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 italic font-medium">"{exam.description || 'No memo available.'}"</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                        {exams.filter(e => e.status === 'Published').length === 0 && (
                            <div className="col-span-full py-20 text-center opacity-30">
                                <Wifi className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                                <p className="font-black uppercase tracking-widest text-sm">No Active Signals Detected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!isBoarded) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
                <Card className="max-w-md w-full bg-white/5 border-white/10 rounded-[40px] text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
                    <CardHeader className="p-8 text-center border-b border-white/5">
                        <UserCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Boarding Session</CardTitle>
                        <CardDescription className="font-bold text-slate-400">{selectedExam.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Participant Name</Label>
                            <Input value={participantName} onChange={e => setParticipantName(e.target.value)} className="bg-white/5 border-white/10 h-12 text-lg font-bold rounded-2xl" placeholder="Your Full Name" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mobile Number</Label>
                            <Input value={participantMobile} onChange={e => setParticipantMobile(e.target.value)} className="bg-white/5 border-white/10 h-12 text-lg font-bold rounded-2xl" placeholder="+880..." />
                        </div>
                        <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20 border-4 border-white/10" onClick={handleBoarding} disabled={!participantName || !participantMobile || isBoardingLoading}>
                            {isBoardingLoading ? 'Establishing Handshake...' : 'Sync & Board Terminal'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!liveExam?.isLive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
                <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse shadow-2xl relative z-10"><Wifi className="h-10 w-10 text-primary" /></div>
                <div className="space-y-2 relative z-10"><h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Waiting for Signal...</h2><p className="text-slate-400 font-medium max-w-xs mx-auto italic leading-tight">Hello {participantName}. The moderator will push the assessment signal shortly. Keep your terminal open.</p></div>
                <Badge variant="outline" className="border-white/10 text-muted-foreground px-6 py-1 font-black uppercase text-[9px] tracking-widest relative z-10 bg-black/40">Terminal Status: Standby Registry</Badge>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-8 relative overflow-hidden">
                <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
                <div className="space-y-2"><h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Assessment Logged</h2><p className="text-slate-400 font-medium italic">Please wait for the moderator to conclude the global session.</p></div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] w-full max-w-xs">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">Status Registry</p>
                    <div className="flex justify-between items-center text-sm font-bold"><span className="text-muted-foreground">Signals Processed:</span><span className="text-primary font-black">{Object.keys(localAnswers).length} / {activeQuestions.length}</span></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* High-Visibility Progress Pulse */}
            <div className="fixed top-0 left-0 right-0 h-3 bg-white/5 z-50">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(0,0,0,0.5)]", timeLeft <= 5 ? "bg-red-500" : "bg-primary")} 
                    style={{ width: `${(timeLeft / (currentQuestion.timeLimitSeconds || 30)) * 100}%` }} 
                />
            </div>

            <div className="max-w-xl w-full space-y-8 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-primary/10 text-primary uppercase font-black tracking-widest text-[9px] border border-primary/20 h-6 px-3">Signal {liveExam.activeQuestionIndex + 1} of {activeQuestions.length}</Badge>
                    <div className="flex items-center gap-3">
                        <div className={cn("text-4xl font-black font-mono transition-colors", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-white/40")}>
                            {timeLeft}s
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Live Window</span>
                        </div>
                    </div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase">{currentQuestion.questionText}</h2>
                <div className="h-1.5 w-24 bg-primary rounded-full" />

                {!isSignalCommitted ? (
                    <RadioGroup value={localAnswers[currentQuestion.id] || ''} onValueChange={handleAnswerSubmit} className="grid gap-4 mt-8">
                        {currentQuestion.options.map((opt, i) => (
                            <OptionPart key={i} opt={opt} isSelected={localAnswers[currentQuestion.id] === opt} id={`o-${i}`} disabled={isSignalCommitted} />
                        ))}
                    </RadioGroup>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] animate-in zoom-in-95">
                        <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-2xl"><CheckCircle2 className="h-8 w-8" /></div>
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase italic">Signal Locked</h3>
                            <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">Waiting for next transmission...</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-6 pt-8">
                    {!isSignalCommitted && (
                        <Button 
                            className="w-full h-16 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 border-4 border-white/10" 
                            disabled={!localAnswers[currentQuestion.id]}
                            onClick={handleCommitSignal}
                        >
                            Finalize Selection
                        </Button>
                    )}
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2 opacity-50">
                        <Timer className="h-3 w-3" /> Synchronized with Master Terminal
                    </p>
                </div>
            </div>
        </div>
    );
}
