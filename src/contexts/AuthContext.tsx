import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendPhoneOtp: (phone: string, fullName?: string) => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // After email verification, redirect users to login page
    const redirectUrl = `${window.location.origin}/auth?email_verified=1`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign In Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out",
        description: "Successfully signed out.",
      });
    }
  };

  // Send SMS OTP to phone. If the user doesn't exist, Supabase will create the user on verification
  const sendPhoneOtp = async (phone: string, fullName?: string) => {
    // Normalize: remove spaces/hyphens
    const trimmed = phone.replace(/[\s-]/g, '').trim();
    // Restrict to Indian numbers only: +91 followed by 10 digits
    const indianRegex = /^\+91\d{10}$/;
    if (!indianRegex.test(trimmed)) {
      const message = "Enter a valid Indian phone number (+911234567890).";
      toast({ variant: "destructive", title: "Invalid phone", description: message });
      return { error: new Error(message) } as { error: any };
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: trimmed,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "OTP Error",
        description: error.message,
      });
    } else {
      toast({
        title: "OTP Sent",
        description: "A verification code was sent to your phone.",
      });
    }

    return { error };
  };

  // Verify the SMS OTP token
  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified.",
      });
    }

    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    sendPhoneOtp,
    verifyPhoneOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};