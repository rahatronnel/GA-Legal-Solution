'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, PlayCircle, BarChart2, Radio, ChevronLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useUser } from '@/firebase';

/**
 * Main ARS Hub - The majestic landing page for the Live Audience Response System.
 * Features 3 primary interaction points: Entry, Broadcast, and Analytics.
 */
export default function ArsMainHub() {
    const { user } = useUser();
    const containerRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        
        tl.from(".ars-hub-header", {
            y: -50,
            opacity: 0,
            duration: 0.8
        });

        tl.from(".ars-hub-card", {
            y: 40,
            opacity: 0,
            stagger: 0.15,
            duration: 1,
            rotationX: -15,
            transformOrigin: "top"
        }, "-=0.4");
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient Background Auras */}
            <div className="absolute top-0 right-0 h-[600px] w-[600px] bg-primary/5 rounded-full blur-[120px] opacity-50" />
            <div className="absolute bottom-0 left-0 h-[600px] w-[600px] bg-blue-500/5 rounded-full blur-[120px] opacity-50" />

            <div className="max-w-6xl w-full space-y-12 relative z-10">
                
                {/* Hub Header */}
                <div className="ars-hub-header text-center space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl mb-4">
                        <Radio className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Signal Hub Active</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase text-white leading-none italic">
                        ARS Master Console
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
                        High-fidelity organizational evaluation & real-time audience engagement engine.
                    </p>
                </div>

                {/* Primary Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* 1. Exam & Survey Entry */}
                    <Link href="/exam/settings" className="ars-hub-card group">
                        <Card className="h-full bg-white/[0.02] border-white/5 hover:border-primary/40 transition-all rounded-[40px] overflow-hidden relative shadow-2xl hover:shadow-primary/10">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                                <ClipboardList className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="p-10">
                                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-primary/20">
                                    <ClipboardList className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">1. Entry Registry</CardTitle>
                                <CardDescription className="text-slate-400 text-base mt-2">
                                    Register sessions and inject question logic before broadcasting.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-10 pb-10">
                                <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                                    Access Registry <ArrowRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* 2. Go Live (Broadcast) */}
                    <Link href="/exam/settings" className="ars-hub-card group">
                        <Card className="h-full bg-white/[0.02] border-white/5 hover:border-emerald-500/40 transition-all rounded-[40px] overflow-hidden relative shadow-2xl hover:shadow-emerald-500/10">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                                <PlayCircle className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="p-10">
                                <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-emerald-500/20">
                                    <PlayCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">2. Go Live</CardTitle>
                                <CardDescription className="text-slate-400 text-base mt-2">
                                    Initialize the broadcast signal and generate audience QR codes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-10 pb-10">
                                <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                                    Push Signal <ArrowRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* 3. Results */}
                    <Link href="/exam/results" className="ars-hub-card group">
                        <Card className="h-full bg-white/[0.02] border-white/5 hover:border-blue-500/40 transition-all rounded-[40px] overflow-hidden relative shadow-2xl hover:shadow-blue-500/10">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                                <BarChart2 className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="p-10">
                                <div className="h-16 w-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/20">
                                    <BarChart2 className="h-8 w-8 text-blue-500" />
                                </div>
                                <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">3. Results</CardTitle>
                                <CardDescription className="text-slate-400 text-base mt-2">
                                    Analyze real-time response matrix and performance scoring.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-10 pb-10">
                                <div className="flex items-center gap-2 text-blue-500 font-black uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                                    Analyze Data <ArrowRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                </div>

                {/* Hub Footer / Controls */}
                <div className="flex justify-between items-center pt-12 border-t border-white/5">
                    <Button variant="ghost" className="rounded-full h-12 gap-2 text-white/60 hover:text-white" asChild>
                        <Link href="/"><ChevronLeft className="h-5 w-5" /> Back to Dashboard</Link>
                    </Button>
                    <div className="flex gap-6 items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <ShieldCheck className="h-4 w-4" /> SECURE MODE ACTIVE
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <Zap className="h-4 w-4 text-amber-500" /> CLOUD SYNCED
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
