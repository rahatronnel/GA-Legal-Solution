
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export type ArsExam = {
    id: string;
    title: string;
    description: string;
    type: 'Exam' | 'Survey';
    status: 'Draft' | 'Published' | 'Archived';
    totalMarks: number;
    passingMarks: number;
    timeLimitMinutes: number;
    activeQuestionIndex: number;
    isLive: boolean;
    createdBy: string;
    createdAt: string;
};

export type ArsQuestion = {
    id: string;
    examId: string;
    questionText: string;
    type: 'MCQ' | 'True/False';
    options: string[];
    correctOption: string;
    points: number;
    timeLimitSeconds: number; // Injected: Question-specific window
};

export type ArsSubmission = {
    id: string;
    examId: string;
    userId: string;
    participantName: string;
    participantMobile: string;
    answers: Record<string, string>;
    score: number;
    percentage: number;
    status?: 'Passed' | 'Failed'; // Made optional to prevent premature conclusion
    submittedAt: string;
};

const ArsContext = createContext<{
    exams: ArsExam[];
    questions: ArsQuestion[];
    submissions: ArsSubmission[];
    isLoading: boolean;
} | undefined>(undefined);

export function ArsProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const { data: exams, isLoading: l1 } = useCollection<ArsExam>(useMemoFirebase(() => firestore ? collection(firestore, 'arsExams') : null, [firestore]));
    const { data: questions, isLoading: l2 } = useCollection<ArsQuestion>(useMemoFirebase(() => firestore ? collection(firestore, 'arsQuestions') : null, [firestore]));
    const { data: submissions, isLoading: l3 } = useCollection<ArsSubmission>(useMemoFirebase(() => firestore ? collection(firestore, 'arsSubmissions') : null, [firestore]));

    const value = useMemo(() => ({
        exams: exams || [],
        questions: questions || [],
        submissions: submissions || [],
        isLoading: l1 || l2 || l3,
    }), [exams, questions, submissions, l1, l2, l3]);

    return <ArsContext.Provider value={value}>{children}</ArsContext.Provider>;
}

export function useArs() {
    const context = useContext(ArsContext);
    if (!context) throw new Error('useArs must be used within an ArsProvider');
    return context;
}
