'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithGoogle, handleRedirectResult } from '@/lib/firebase/auth';
import { getUser } from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated with complete profile
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'pharmacy') {
        router.push('/pharmacy/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // On mount: capture the result if returning from a mobile Google redirect
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const firebaseUser = await handleRedirectResult();
        if (!firebaseUser) return; // Not a redirect return, nothing to do

        // Only set loading if we actually have a redirect result to process
        setLoading(true);
        const existingUser = await getUser(firebaseUser.uid);
        if (existingUser) {
          router.push(existingUser.role === 'pharmacy' ? '/pharmacy/dashboard' : '/dashboard');
        } else {
          router.push('/register');
        }
      } catch (err: any) {
        // Silently ignore user-cancelled — they just closed the Google screen
        if (
          err.code === 'auth/user-cancelled' ||
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request'
        ) {
          return;
        }
        console.error('Redirect sign-in error:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    checkRedirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getErrorMessage = (err: any): string => {
    if (err.code === 'auth/user-cancelled') return 'Sign-in cancelled. Please try again.';
    if (err.code === 'auth/popup-closed-by-user') return 'Sign-in cancelled. Please try again.';
    if (err.code === 'auth/cancelled-popup-request') return 'Sign-in cancelled. Please try again.';
    if (err.code === 'auth/popup-blocked') return 'Popup blocked. Please allow popups for this site.';
    if (err.code === 'auth/network-request-failed') return 'Network error. Please check your connection.';
    if (err.code === 'auth/unauthorized-domain') return 'This domain is not authorised. Check Firebase console.';
    return 'Failed to sign in. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const firebaseUser = await signInWithGoogle();

      // Only reached on desktop (popup flow)
      const existingUser = await getUser(firebaseUser.uid);
      if (existingUser) {
        router.push(existingUser.role === 'pharmacy' ? '/pharmacy/dashboard' : '/dashboard');
      } else {
        router.push('/register');
      }
    } catch (err: any) {
      // Silently ignore user-cancelled — they just closed the Google popup
      if (
        err.code === 'auth/user-cancelled' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        setLoading(false);
        return;
      }
      console.error('Error signing in with Google:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Login</h1>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo.png"
          alt="Where is My Medicine"
          width={150}
          height={60}
          className="h-14 w-auto"
          priority
        />
      </div>

      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-8">
          Sign in to continue to Where is My Medicine
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleGoogleSignIn}
          isLoading={loading}
          variant="outline"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-black font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
