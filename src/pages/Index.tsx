import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StudentForm } from '@/components/StudentForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { InternshipForm } from '@/components/InternshipForm';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Settings, Building2, Sparkles, Target, Users, Award, LogOut } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('student');
  const { signOut } = useAuth();

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button 
              onClick={() => setActiveTab('student')}
              variant="ghost"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Apply for Internship
            </Button>
            <Button 
              onClick={() => setActiveTab('admin')}
              variant="ghost"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
            <Button 
              onClick={() => signOut()}
              variant="ghost"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/20 hover:bg-white/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart AI-Powered Allocation
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Smart Internship
                <br />
                <span className="text-transparent bg-gradient-to-r from-white to-white/80 bg-clip-text">
                  Allocation System
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Revolutionary platform that matches students with perfect internship opportunities using advanced algorithms and comprehensive skill assessment.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button 
                onClick={() => setActiveTab('student')}
                variant="ghost"
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Apply for Internship
              </Button>
              <Button 
                onClick={() => setActiveTab('admin')}
                variant="ghost"
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-gradient-primary w-fit mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Smart Matching</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered algorithm matches students with internships based on skills, preferences, and performance.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-gradient-accent w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Fair Allocation</h3>
                <p className="text-sm text-muted-foreground">
                  Ensures equitable distribution considering quotas, categories, and merit-based selection.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-gradient-surface w-fit mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Results</h3>
                <p className="text-sm text-muted-foreground">
                  Instant allocation results with detailed scoring and transparent reasoning for each placement.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full md:w-fit md:grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger 
                value="student"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Student Portal
              </TabsTrigger>
              <TabsTrigger 
                value="internship"
                className="data-[state=active]:bg-gradient-accent data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Add Internship
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="data-[state=active]:bg-gradient-surface data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold mb-2">Student Application Portal</h2>
                  <p className="text-muted-foreground">
                    Submit your application and get matched with the best internship opportunities
                  </p>
                </div>
                <StudentForm />
              </div>
            </TabsContent>

            <TabsContent value="internship" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold mb-2">Internship Management</h2>
                  <p className="text-muted-foreground">
                    Add new internship opportunities for students to apply
                  </p>
                </div>
                <InternshipForm />
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
              <AdminDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Smart Internship Allocation System. Built with modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
