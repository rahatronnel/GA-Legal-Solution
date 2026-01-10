
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, initiateEmailSignIn, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

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

  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: orgSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);


  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }
      await initiateEmailSignIn(auth, email, password);
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      let description = 'An unknown error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          description = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
            description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
            break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
      if (!resetEmail) {
          toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address.' });
          return;
      }
      setIsResetting(true);
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: `If an account exists for ${resetEmail}, you will receive an email with instructions to reset your password.`,
        });
        setIsResetDialogOpen(false);
        setResetEmail('');
      } catch (error: any) {
          console.error("Password reset failed:", error);
          let description = 'An unknown error occurred. Please try again.';
            if (error.code === 'auth/user-not-found') {
                description = 'No account found with this email address.';
            }
          toast({
              variant: 'destructive',
              title: 'Failed to Send',
              description: description,
          });
      } finally {
          setIsResetting(false);
      }
  };


  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            {isLoadingSettings ? (
              <>
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{orgSettings?.name || 'Welcome'}</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your credentials to access the system
                </p>
              </>
            )}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                 <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="link" className="ml-auto inline-block text-sm underline">Forgot your password?</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>
                                Enter your email address below. If an account exists, we'll send you a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    disabled={isResetting}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={isResetting}>Cancel</Button>
                            <Button onClick={handlePasswordReset} disabled={isResetting}>
                                {isResetting ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                onKeyUp={(e) => e.key === 'Enter' && handleSignIn()}
              />
            </div>
            <Button onClick={handleSignIn} disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
        <Image
          src="https://picsum.photos/seed/login/1920/1080"
          alt="Office Background"
          data-ai-hint="office building"
          layout="fill"
          objectFit="cover"
          className="opacity-20"
        />
        <div className="z-10 text-center space-y-4">
          {isLoadingSettings ? (
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          ) : (
            orgSettings?.logo && (
              <Image
                src={orgSettings.logo}
                alt="Company Logo"
                width={150}
                height={150}
                className="rounded-full mx-auto border-4 border-white shadow-lg"
              />
            )
          )}
          <h2 className="text-4xl font-bold text-foreground">
             {orgSettings?.name || 'GA & Legal Solution'}
          </h2>
          <p className="text-lg text-muted-foreground">
             {orgSettings?.slogan || 'Your Trusted Partner in Excellence'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
    return <LoginPageContent />;
}
