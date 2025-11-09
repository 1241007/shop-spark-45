import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShoppingBag } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });
  const [signupMethod, setSignupMethod] = useState<'email' | 'sms'>('email');
  const [phoneSignup, setPhoneSignup] = useState({ fullName: '', phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const { signIn, signUp, user, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // If returning from email verification, switch to login tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('email_verified') === '1') {
      // We cannot programmatically switch TabsTrigger value without a state; so rely on default and UX prompt
      // Optionally, we could scroll or display a subtle hint. Keeping simple: no-op here.
    }
  }, [location.search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (!error) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupMethod === 'email') {
      if (signupForm.password !== signupForm.confirmPassword) {
        return;
      }
      setIsLoading(true);
      const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
      if (!error) {
        setSignupForm({ email: '', password: '', fullName: '', confirmPassword: '' });
      }
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSignup.fullName || !phoneSignup.phone) return;
    setIsLoading(true);
    const { error } = await sendPhoneOtp(phoneSignup.phone, phoneSignup.fullName);
    if (!error) {
      setOtpSent(true);
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSignup.phone || !phoneSignup.otp) return;
    setIsLoading(true);
    const { error } = await verifyPhoneOtp(phoneSignup.phone, phoneSignup.otp);
    setIsLoading(false);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ShopSpark
          </h1>
          <p className="text-muted-foreground mt-2">Your favorite online store</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account to continue shopping</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Join ShopSpark and start shopping today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Button type="button" variant={signupMethod === 'email' ? 'default' : 'outline'} onClick={() => setSignupMethod('email')}>Email</Button>
                  <Button type="button" variant={signupMethod === 'sms' ? 'default' : 'outline'} onClick={() => setSignupMethod('sms')}>SMS</Button>
                </div>

                {signupMethod === 'email' && (
                  <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  {signupForm.password !== signupForm.confirmPassword && signupForm.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || signupForm.password !== signupForm.confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  </form>
                )}

                {signupMethod === 'sms' && (
                  <form className="space-y-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                    <div className="space-y-2">
                      <Label htmlFor="sms-name">Full Name</Label>
                      <Input
                        id="sms-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={phoneSignup.fullName}
                        onChange={(e) => setPhoneSignup({ ...phoneSignup, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms-phone">Phone (E.164)</Label>
                      <Input
                        id="sms-phone"
                        type="tel"
                        placeholder="e.g. +15551234567"
                        value={phoneSignup.phone}
                        onChange={(e) => setPhoneSignup({ ...phoneSignup, phone: e.target.value })}
                        required
                      />
                    </div>
                    {otpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="sms-otp">Verification Code</Label>
                        <Input
                          id="sms-otp"
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter OTP"
                          value={phoneSignup.otp}
                          onChange={(e) => setPhoneSignup({ ...phoneSignup, otp: e.target.value })}
                          required
                        />
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {otpSent ? 'Verifying...' : 'Sending OTP...'}
                        </>
                      ) : (
                        otpSent ? 'Verify OTP' : 'Send OTP'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;