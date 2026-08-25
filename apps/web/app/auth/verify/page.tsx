'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setErrorMessage('Missing authentication parameters in link');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/auth/magic-link/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Invalid or expired link');
        }

        localStorage.setItem('lr_access_token', data.data.tokens.accessToken);
        localStorage.setItem('lr_refresh_token', data.data.tokens.refreshToken);
        localStorage.setItem('lr_user', JSON.stringify(data.data.user));

        setStatus('success');
        setTimeout(() => {
          router.push(data.data.user.role === 'GUEST' ? '/' : '/organizer');
        }, 1200);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Verification failed';
        setStatus('error');
        setErrorMessage(errorMsg || 'Could not verify magic link. Please try signing in with your password or register a new account.');
      }
    };

    void verify();
  }, [token, email, router]);

  return (
    <div className="text-center py-8 space-y-4">
      {status === 'verifying' && (
        <>
          <Loader2 size={36} className="animate-spin text-lr-accent mx-auto" />
          <h2 className="text-xl font-bold text-lr-text">Verifying your link...</h2>
          <p className="lr-body-sm text-lr-text-muted">
            Hold tight, authenticating your session securely.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 size={36} className="text-lr-success mx-auto animate-scale-in" />
          <h2 className="text-xl font-bold text-lr-text">Signed In!</h2>
          <p className="lr-body-sm text-lr-text-muted">
            Redirecting you to your dashboard...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={36} className="text-lr-error mx-auto animate-scale-in" />
          <h2 className="text-xl font-bold text-lr-text">Verification Failed</h2>
          <p className="lr-body-sm text-lr-text-muted">{errorMessage}</p>
          <div className="pt-4">
            <Link href="/login" className="lr-btn lr-btn-primary lr-btn-sm">
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function MagicLinkVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-lr-bg">
      <div className="lr-card lr-glass max-w-md w-full p-8 shadow-2xl">
        <Suspense fallback={<div className="text-center text-lr-text-muted">Loading...</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
