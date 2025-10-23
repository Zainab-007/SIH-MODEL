import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, GraduationCap, Shield, Users, Building } from 'lucide-react';

const Auth = () => {
  const { toast } = useToast();
  const { user, signIn, signUp, loading } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'admin' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '', confirmPassword: '', role: 'student' });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'student': return <Users className="h-4 w-4" />;
      case 'company': return <Building className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const roles = [
    { value: 'admin', label: 'Admin', icon: Shield },
    { value: 'student', label: 'Student', icon: Users },
    { value: 'company', label: 'Company', icon: Building }
  ];

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Determine the correct endpoint based on role
      let endpoint = '/admin_login';
      if (loginData.role === 'student') endpoint = '/student_login';
      if (loginData.role === 'company') endpoint = '/company_login';

      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          userType: loginData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });

        // Redirect based on role
        setTimeout(() => {
          if (loginData.role === 'admin') {
            window.location.href = 'http://127.0.0.1:5000/admin-dashboard';
          } else if (loginData.role === 'student') {
            window.location.href = 'http://127.0.0.1:5000/student-dashboard';
          } else if (loginData.role === 'company') {
            window.location.href = 'http://127.0.0.1:5000/company-dashboard';
          }
        }, 1000);
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
    
    setFormLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);

    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    
    if (error) {
      toast({
        title: "Signup Failed", 
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link",
      });
    }
    
    setFormLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative w-full max-w-md">
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="p-3 rounded-full bg-gradient-primary w-fit mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Optima</CardTitle>
            <CardDescription>
              Smart Internship Allocation System - Choose your role to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-accent data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Login as:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role) => {
                        const IconComponent = role.icon;
                        return (
                          <label
                            key={role.value}
                            className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              loginData.role === role.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="loginRole"
                              value={role.value}
                              checked={loginData.role === role.value}
                              onChange={(e) => setLoginData(prev => ({ ...prev, role: e.target.value }))}
                              className="sr-only"
                            />
                            <IconComponent className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">{role.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={formLoading}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium h-11"
                  >
                    {formLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Sign up as:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role) => {
                        const IconComponent = role.icon;
                        return (
                          <label
                            key={role.value}
                            className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              signupData.role === role.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="signupRole"
                              value={role.value}
                              checked={signupData.role === role.value}
                              onChange={(e) => setSignupData(prev => ({ ...prev, role: e.target.value }))}
                              className="sr-only"
                            />
                            <IconComponent className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">{role.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Password</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={formLoading}
                    className="w-full bg-gradient-accent hover:opacity-90 text-white font-medium h-11"
                  >
                    {formLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <Users className="h-4 w-4" />
                <Building className="h-4 w-4" />
              </p>
              <p className="mt-2">Unified portal for all user types</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;