
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
import { initiateEmailSignIn, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Building } from 'lucide-react';

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
    <div className="w-full min-h-screen flex items-stretch">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          {isLoadingSettings ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : (
            orgSettings?.logo ? (
              <Image src={orgSettings.logo} alt="Organization Logo" width={40} height={40} className="rounded-full"/>
            ) : (
              <Building className="h-8 w-8" />
            )
          )}
           <span className="text-xl font-bold">{isLoadingSettings ? <Skeleton className="h-6 w-40" /> : (orgSettings?.name || 'Welcome')}</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Access Your Digital Workspace</h1>
          <p className="text-gray-400 mt-4">
            The comprehensive solution for managing your organization's general affairs, legal matters, and vehicle fleet with efficiency and precision.
          </p>
        </div>
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} {orgSettings?.name || 'Your Company'}. All Rights Reserved.</p>
      </div>

      <div className="w-full lg:w-1/2 bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                <Label htmlFor="password">Password</Label>
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
             <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                     <Button variant="link" className="px-0 justify-start text-sm">Forgot your password?</Button>
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
            <Button onClick={handleSignIn} disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
    return <LoginPageContent />;
}
