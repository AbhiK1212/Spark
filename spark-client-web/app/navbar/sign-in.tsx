'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signOut } from '@/utilities/firebase/firebase';
import { User } from 'firebase/auth';

interface SignInProps {
  user: User | null;
}

export default function SignIn({ user }: SignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Firebase not configured')) {
        alert(
          'Firebase not configured. Please check SETUP.md for instructions on setting up your environment variables.'
        );
      } else if (errorMessage.includes('auth/popup-closed-by-user')) {
        // User closed the popup, don't show error
        return;
      } else if (errorMessage.includes('api-key-expired')) {
        alert(
          'Firebase API key has expired. Please check TROUBLESHOOTING.md for steps to get a new API key.'
        );
      } else if (errorMessage.includes('auth/invalid-api-key')) {
        alert(
          'Invalid Firebase API key. Please check TROUBLESHOOTING.md for steps to fix your API key configuration.'
        );
      } else {
        alert(
          `Sign in failed: ${errorMessage}. Please check your Firebase configuration.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fragment>
      {user ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-spark-yellow rounded-full flex items-center justify-center">
              <span className="text-ink-gray font-semibold text-sm">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">
              {user.displayName || user.email}
            </span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSignIn}
          variant="spark"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      )}
    </Fragment>
  );
}
