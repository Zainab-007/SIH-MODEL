import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Building2, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';

const Home = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInternships: 0,
    totalAllocations: 0,
    activeInternships: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, internshipsRes, allocationsRes] = await Promise.all([
        supabase.from('students').select('id'),
        supabase.from('internships').select('id'),
        supabase.from('allocations').select('id')
      ]);

      setStats({
        totalStudents: studentsRes.data?.length || 0,
        totalInternships: internshipsRes.data?.length || 0,
        totalAllocations: allocationsRes.data?.length || 0,
        activeInternships: internshipsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const allocationRate = stats.totalStudents > 0 ? (stats.totalAllocations / stats.totalStudents) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="relative px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Smart Internship Allocation System
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Efficiently matching students with perfect internship opportunities using 
            advanced algorithms and comprehensive assessment.
          </p>
          <div className="mt-6">
            <Badge className="bg-white/20 text-white border-white/20 hover:bg-white/30">
              Government of India Initiative
            </Badge>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '--' : stats.totalStudents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Internships</p>
                <p className="text-2xl font-bold text-secondary">
                  {loading ? '--' : stats.totalInternships}
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allocations</p>
                <p className="text-2xl font-bold text-accent">
                  {loading ? '--' : stats.totalAllocations}
                </p>
              </div>
              <div className="p-3 rounded-full bg-accent/10">
                <Target className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-success">
                  {loading ? '--' : Math.round(allocationRate)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <Award className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Allocation Progress
            </CardTitle>
            <CardDescription>
              Current status of student-internship matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(allocationRate)}%</span>
              </div>
              <Progress value={allocationRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Allocated: {stats.totalAllocations}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm">Pending: {stats.totalStudents - stats.totalAllocations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Key Features
            </CardTitle>
            <CardDescription>
              Advanced allocation system capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded bg-primary/10">
                  <CheckCircle className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">AI-powered skill matching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded bg-secondary/10">
                  <CheckCircle className="h-3 w-3 text-secondary" />
                </div>
                <span className="text-sm">Category-wise quota allocation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded bg-accent/10">
                  <CheckCircle className="h-3 w-3 text-accent" />
                </div>
                <span className="text-sm">Location preference matching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded bg-success/10">
                  <CheckCircle className="h-3 w-3 text-success" />
                </div>
                <span className="text-sm">Real-time allocation results</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access key functionalities based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Student Portal</h3>
              <p className="text-sm text-muted-foreground">Submit application and track status</p>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <Building2 className="h-8 w-8 text-secondary mb-2" />
              <h3 className="font-semibold mb-1">Company Portal</h3>
              <p className="text-sm text-muted-foreground">Add internship opportunities</p>
            </div>
            
            {profile?.role === 'admin' && (
              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <Settings className="h-8 w-8 text-accent mb-2" />
                <h3 className="font-semibold mb-1">Admin Dashboard</h3>
                <p className="text-sm text-muted-foreground">Run allocation and manage system</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;