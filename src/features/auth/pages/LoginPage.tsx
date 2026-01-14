/**
 * Login Page
 * Online MBA - Authentication entry point
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogIn, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_CONFIG } from '../../../core/config/constants';
import { Button } from '../../../shared/components/ui/Button';

// ============================================
// Types
// ============================================

interface LoginPageProps {
  onGoogleSignIn: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

// ============================================
// Features List
// ============================================

const features = [
  'Access world-class MBA curriculum',
  'Learn from industry experts',
  'Collaborate with peers globally',
  'Track your progress in real-time',
];

// ============================================
// Login Page Component
// ============================================

export const LoginPage = memo(function LoginPage({
  onGoogleSignIn,
  isLoading = false,
  error,
}: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(error || null);

  // Get redirect path from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/overview';

  // Handle Google Sign In
  const handleGoogleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      await onGoogleSignIn();
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setAuthError(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [onGoogleSignIn, navigate, from]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => setAuthError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div
        className={cn(
          'hidden lg:flex lg:w-1/2 xl:w-3/5',
          'flex-col justify-between',
          'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950',
          'p-12 relative overflow-hidden'
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(253,98,27,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,106,255,0.1),transparent_50%)]" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary-500/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl',
                'bg-gradient-to-br from-primary-500 to-primary-600',
                'flex items-center justify-center',
                'shadow-glow-primary'
              )}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{APP_CONFIG.name}</h1>
              <p className="text-sm text-neutral-400">by {APP_CONFIG.company}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Transform Your Career with{' '}
            <span className="text-gradient-primary">World-Class</span>{' '}
            Business Education
          </h2>
          <p className="text-lg text-neutral-400 mb-8">
            Join thousands of professionals elevating their careers through our
            comprehensive online MBA program.
          </p>

          {/* Features List */}
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-neutral-300"
              >
                <div className="w-6 h-6 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-success-400" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {APP_CONFIG.company}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        className={cn(
          'w-full lg:w-1/2 xl:w-2/5',
          'flex items-center justify-center',
          'bg-white dark:bg-neutral-950',
          'p-8'
        )}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-12 lg:hidden">
            <div
              className={cn(
                'w-12 h-12 rounded-xl',
                'bg-gradient-to-br from-primary-500 to-primary-600',
                'flex items-center justify-center',
                'shadow-glow-primary'
              )}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                {APP_CONFIG.name}
              </h1>
              <p className="text-sm text-neutral-500">by {APP_CONFIG.company}</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div
              className={cn(
                'mb-6 p-4 rounded-xl',
                'bg-error-50 dark:bg-error-950/30',
                'border border-error-200 dark:border-error-900',
                'text-error-700 dark:text-error-400',
                'text-sm',
                'animate-fade-in'
              )}
              role="alert"
            >
              {authError}
            </div>
          )}

          {/* Sign In Button */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleGoogleSignIn}
            isLoading={isSigningIn || isLoading}
            loadingText="Signing in..."
            className={cn(
              'h-14',
              'bg-white dark:bg-neutral-900',
              'border-2 border-neutral-200 dark:border-neutral-700',
              'hover:border-neutral-300 dark:hover:border-neutral-600',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              'text-neutral-900 dark:text-white'
            )}
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-950 text-neutral-500">
                Authorized users only
              </span>
            </div>
          </div>

          {/* Info */}
          <div
            className={cn(
              'p-4 rounded-xl',
              'bg-neutral-50 dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800'
            )}
          >
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              Please sign in with your registered{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                Scaler
              </span>{' '}
              email address to access the portal.
            </p>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-center text-sm text-neutral-500">
            Having trouble signing in?{' '}
            <a
              href={`mailto:${APP_CONFIG.supportEmail}`}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Contact Support
            </a>
          </p>

          {/* Mobile Footer */}
          <p className="mt-8 text-center text-xs text-neutral-400 lg:hidden">
            &copy; {new Date().getFullYear()} {APP_CONFIG.company}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;
