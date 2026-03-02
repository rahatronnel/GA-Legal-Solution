'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useArs, type ArsExam, type ArsQuestion } from '../components/ars-provider';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Timer, ChevronRight, ChevronLeft, GraduationCap, Send, AlertCircle, Home, X, Layers } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * OptionPart - A micro-level differentiated interaction component.
 */
const OptionPart = ({ 
    opt, 
    isSelected, 
    id, 
    index 
}: { 
    opt: string, 
    isSelected: boolean, 
    id: string,
    index: number
}) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (isSelected) {
            gsap.to(itemRef.current, {
                scale: 1.02,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                duration: 0.3,
                ease: 'power2.out'
            });
        } else {
            gsap.to(itemRef.current, {
                scale: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }, { dependencies: [isSelected] });

    return (
        <div ref={itemRef} className="group">
            <Label 
                htmlFor={id}
                className={cn(
                    "flex items-center gap-4 p-6 rounded-[24px] border-2 cursor-pointer transition-all active:scale-[0.98]",
                    isSelected 
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]" 
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                )}
            >
                <div className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-white/20"
                )}>
                    {isSelected && <div className="h-2 w-2 bg-slate-950 rounded-full" />}
                </div>
                <span className={cn(
                    "text-lg font-bold tracking-tight transition-colors",
                    isSelected ? "text-white" : "text-white/60 group-hover:text-white/80"
                )}>{opt}</span>
                <RadioGroupItem value={opt} id={id} className="sr-only" />
            </Label>
        </div>
    );
};

/**
 * QuestionPart - A micro-level differentiated component for ARS response.
 * Uses atomic state and localized GSAP pulses.
 */
const QuestionPart = ({ 
    question, 
    value, 
    onChange, 
    index, 
    total 
}: { 
    question: ArsQuestion, 
    value: string, 
    onChange: (val: string) => void,
    index: number,
    total: number
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.fromTo(containerRef.current, 
            { opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.95 }, 
            { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, duration: 0.6, ease: 'expo.out' }
        );
    }, { scope: containerRef, dependencies: [question.id] });

    return (
        <div ref={containerRef} className="space-y-8">
            <div className="flex justify-between items-center">
                <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-[0.2em]">Quantum Step {index + 1} of {total}</Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Sync Active</span>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter leading-none text-white">{question.questionText}</h2>
                <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-transparent rounded-full" />
            </div>

            <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 gap-4">
                {question.options.map((opt, i) => (
                    <OptionPart 
                        key={i} 
                        opt={opt} 
                        isSelected={value === opt} 
                        id={`q-${question.id}-o-${i}`} 
                        index={i}
                    />
                ))}
            </RadioGroup>
        </div>
    );
};

export default function ArsEntryPage() {
    const { exams, questions, isLoading } = useArs();
    const { user } = useUser();
    const firestore = useFirestore();

    const [selectedExam, setSelectedExam] = useState<ArsExam | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [finalResult, setFinalResult] = useState<any>(null);

    const activeQuestions = useMemo(() => 
        questions.filter(q => q.examId === selectedExam?.id), 
    [questions, selectedExam]);

    const progress = Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100);

    const handleSubmit = () => {
        if (!selectedExam || !user || !firestore) return;

        let score = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id] === q.correctOption) {
                score += q.points;
            }
        });

        const percentage = (score / selectedExam.totalMarks) * 100;
        const status = score >= selectedExam.passingMarks ? 'Passed' : 'Failed';

        const submissionData = {
            examId: selectedExam.id,
            userId: user.uid,
            answers,
            score,
            percentage,
            status,
            submittedAt: new Date().toISOString()
        };

        const colRef = collection(firestore, 'arsSubmissions');
        addDocumentNonBlocking(colRef, submissionData);
        
        setFinalResult(submissionData);
        setIsFinished(true);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (isFinished) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div className="max-w-md w-full animate-in zoom-in-95 duration-700">
                    <Card className="border-none bg-white/5 backdrop-blur-3xl shadow-2xl rounded-[40px] overflow-hidden">
                        <div className={cn(
                            "p-12 text-center text-white",
                            finalResult.status === 'Passed' ? "bg-emerald-600" : "bg-destructive"
                        )}>
                            <div className="mx-auto h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                                {finalResult.status === 'Passed' ? <CheckCircle2 className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Result: {finalResult.status}</h2>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Raw Score</p>
                                    <p className="text-2xl font-black text-white">{finalResult.score} / {selectedExam?.totalMarks}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Percentage</p>
                                    <p className="text-2xl font-black text-white">{Math.round(finalResult.percentage)}%</p>
                                </div>
                            </div>
                            <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20" asChild>
                                <Link href="/"><Home className="mr-2 h-5 w-5" /> Return Home</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!selectedExam) {
        return (
            <div className="min-h-screen p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-[20px] backdrop-blur-xl border border-white/10 shadow-2xl">
                                <GraduationCap className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">ARS Registry</h1>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Certified Organizational Evaluation System</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="rounded-full h-12 w-12 hover:bg-white/5" asChild><Link href="/"><X className="h-6 w-6 text-white/40" /></Link></Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.filter(e => e.status === 'Published').map(exam => (
                            <Card key={exam.id} className="group bg-white/[0.02] border-white/5 hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-500 rounded-[32px] overflow-hidden cursor-pointer" onClick={() => setSelectedExam(exam)}>
                                <CardHeader className="p-8">
                                    <Badge className="w-fit mb-4 bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest">{exam.timeLimitMinutes} Minutes</Badge>
                                    <CardTitle className="text-2xl font-black text-white group-hover:text-primary transition-colors">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-slate-400 font-medium leading-relaxed">{exam.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <Layers className="h-3 w-3" /> {questions.filter(q => q.examId === exam.id).length} Questions
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = activeQuestions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* AMBIENT BACKGROUND GLOWS */}
            <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-2xl w-full space-y-8 relative z-10">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
                        <span>Progress Efficiency</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-white/5" />
                </div>
                
                {currentQuestion ? (
                    <QuestionPart 
                        question={currentQuestion} 
                        value={answers[currentQuestion.id] || ''}
                        onChange={(val) => setAnswers({...answers, [currentQuestion.id]: val})}
                        index={currentQuestionIndex}
                        total={activeQuestions.length}
                    />
                ) : (
                    <div className="p-12 text-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center border border-primary/20 shadow-2xl">
                            <Send className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ready to Certify?</h2>
                        <p className="text-slate-400 font-medium">Verify your responses before final submission.</p>
                    </div>
                )}

                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                    <Button 
                        variant="ghost" 
                        className="h-14 px-8 rounded-full font-black uppercase tracking-widest text-white/40 hover:text-white"
                        onClick={() => currentQuestionIndex > 0 ? setCurrentQuestionIndex(i => i - 1) : setSelectedExam(null)}
                    >
                        <ChevronLeft className="mr-2 h-5 w-5" /> {currentQuestionIndex === 0 ? 'Quit Exam' : 'Previous'}
                    </Button>

                    {currentQuestionIndex < activeQuestions.length - 1 ? (
                        <Button 
                            className="h-14 px-10 rounded-full font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20"
                            disabled={!answers[currentQuestion?.id]}
                            onClick={() => setCurrentQuestionIndex(i => i + 1)}
                        >
                            Next Question <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    ) : (
                        <Button 
                            className="h-14 px-10 rounded-full font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            onClick={handleSubmit}
                        >
                            Submit Evaluation <CheckCircle2 className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
