'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Lock } from 'lucide-react';

import {
  initiateEmailSignIn,
  useAuth,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'organization') : null),
    [firestore]
  );
  const { data: orgSettings, isLoading: isLoadingSettings } =
    useDoc<OrganizationSettings>(settingsRef);

  const playSoftClick = () => {
    const audio = new Audio('/sounds/soft-click.mp3');
    audio.volume = 0.18;
    audio.play();
  };

  const handleSignIn = async () => {
    setAuthenticating(true);
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: 'Invalid credentials',
      });
      setAuthenticating(false);
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: 'Password reset email sent' });
      setResetOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send email' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    document.documentElement.style.setProperty('--rx', `${-y}deg`);
    document.documentElement.style.setProperty('--ry', `${x}deg`);
    document.documentElement.style.setProperty('--mx', `${x * 6}px`);
    document.documentElement.style.setProperty('--my', `${y * 6}px`);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-black"
    >
      {/* BACKGROUND */}
      <Image
        src="https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc"
        alt="Background"
        fill
        priority
        className="object-cover scale-110"
      />
      <div className="absolute inset-0 bg-black/65" />

      {/* COLOR AURAS */}
      <div className="absolute -left-48 bottom-0 h-[520px] w-[520px] bg-orange-500/35 blur-3xl" />
      <div className="absolute -right-48 top-0 h-[520px] w-[520px] bg-pink-500/35 blur-3xl" />
      <div className="absolute right-10 bottom-24 h-[420px] w-[420px] bg-purple-500/35 blur-3xl" />

      {/* GLASS */}
      <div className="relative z-10 min-h-screen flex items-center justify-center perspective-[1200px]">
        <div
          className="
            relative w-[380px] h-[500px] rounded-full
            bg-white/10 backdrop-blur-2xl
            border border-white/20
            shadow-[0_0_160px_rgba(255,255,255,0.35)]
            flex flex-col justify-center px-8
            transition-transform duration-200 ease-out
            active:scale-[0.985]
          "
          style={{
            transform: `rotateX(var(--rx)) rotateY(var(--ry))`,
          }}
        >
          {/* SPECULAR LIGHT */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.38), transparent 58%)',
            }}
          />

          {/* FACE ID OVERLAY */}
          {authenticating && (
            <div className="
              absolute inset-0 rounded-full z-20
              bg-white/20 backdrop-blur-3xl
              flex items-center justify-center
              animate-[faceid_1.4s_ease-out_forwards]
            ">
              <div className="h-16 w-16 rounded-full border-2 border-white/60 animate-spin" />
            </div>
          )}

          {/* LOGO + TITLE */}
          <div className="relative z-10 text-center mb-6 flex flex-col items-center">
            {isLoadingSettings ? (
              <Skeleton className="h-[72px] w-[72px] rounded-full mb-5" />
            ) : orgSettings?.logo && (
              <div
                className="
                  relative mb-5 h-[72px] w-[72px]
                  animate-[logo-in_900ms_cubic-bezier(0.22,1,0.36,1)_forwards]
                  opacity-0
                "
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
                <Image
                  src={orgSettings.logo}
                  alt="Organization Logo"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
            )}

            <h1 className="text-white text-2xl font-medium tracking-wide">
              Sign in
            </h1>
          </div>

          {/* EMAIL */}
          <div className="relative mb-4 z-10">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <Input
              className="pl-12 h-11 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="relative mb-6 z-10">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <Input
              type="password"
              className="pl-12 h-11 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>

          {/* LOGIN */}
          <Button
            disabled={isLoading}
            onClick={() => {
              playSoftClick();
              handleSignIn();
            }}
            className="
              h-11 rounded-full bg-white/90 text-black font-medium
              hover:shadow-[0_0_48px_rgba(255,255,255,0.95)]
              transition-all
            "
          >
            {isLoading ? 'Signing in…' : 'LOGIN'}
          </Button>

          {/* FORGOT */}
          <div className="relative z-10 mt-4 text-center text-xs text-white/65">
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger className="hover:text-white transition">
                Forgot password?
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email to reset your password.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <DialogFooter>
                  <Button onClick={handleReset} disabled={isResetting}>
                    Send Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
