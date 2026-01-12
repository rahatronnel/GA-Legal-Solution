
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  initiateEmailSignIn,
  useFirestore,
  useDoc,
  useMemoFirebase,
  useAuth,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Lock } from 'lucide-react';

function LoginPageContent() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'organization') : null),
    [firestore]
  );
  const { data: orgSettings, isLoading: isLoadingSettings } =
    useDoc<OrganizationSettings>(settingsDocRef);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: 'Invalid credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox.',
      });
      setIsResetDialogOpen(false);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reset email.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* 🎥 BACKGROUND IMAGE */}
      <Image
        src="https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc"
        alt="Background"
        fill
        priority
        className="object-cover scale-105"
      />

      {/* DARK CINEMATIC OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 🌈 ANIMATED COLOR WAVES */}
      <div className="absolute -left-40 bottom-0 h-[520px] w-[520px] bg-orange-500/40 rounded-full blur-3xl animate-waveSlow" />
      <div className="absolute -right-40 top-0 h-[520px] w-[520px] bg-pink-500/40 rounded-full blur-3xl animate-waveSlower" />
      <div className="absolute right-10 bottom-20 h-[420px] w-[420px] bg-purple-500/40 rounded-full blur-3xl animate-waveSlow" />

      {/* 💎 GLASS SPHERE */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="relative w-[380px] h-[480px] rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_120px_rgba(255,255,255,0.25)] flex flex-col justify-center px-8 animate-floatSlow overflow-hidden">

          {/* ✨ GLASS LIGHT SWEEP */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-30 animate-shine" />

          <div className="relative z-10 text-center mb-6">
            {isLoadingSettings ? (
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
            ) : (
              orgSettings?.logo && (
                <div className="mx-auto mb-4 h-20 w-20 relative">
                  <Image
                    src={orgSettings.logo}
                    alt="Organization Logo"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )
            )}
            <h1 className="text-white text-2xl font-semibold tracking-wide">
              Sign in
            </h1>
          </div>

          {/* USERNAME */}
          <div className="relative mb-4 z-10">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <Input
              className="pl-12 h-11 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* PASSWORD */}
          <div className="relative mb-6 z-10">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <Input
              type="password"
              className="pl-12 h-11 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyUp={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>

          {/* LOGIN */}
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="relative z-10 h-11 rounded-full bg-white/90 text-black font-semibold hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all"
          >
            {isLoading ? 'Signing in…' : 'LOGIN'}
          </Button>

          {/* FOOTER */}
          <div className="relative z-10 flex justify-between text-xs text-white/70 mt-4 px-1">
            <span>Remember me</span>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger className="hover:text-white transition">
                Forgot password?
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email to reset password.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <DialogFooter>
                  <Button onClick={handlePasswordReset} disabled={isResetting}>
                    Send Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        </div>
      </div>

      {/* 🌟 CUSTOM ANIMATIONS */}
      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-floatSlow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        @keyframes waveSlow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(40px); }
        }
        .animate-waveSlow {
          animation: waveSlow 12s ease-in-out infinite;
        }

        .animate-waveSlower {
          animation: waveSlow 18s ease-in-out infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(100%) rotate(25deg); }
        }
        .animate-shine {
          animation: shine 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
