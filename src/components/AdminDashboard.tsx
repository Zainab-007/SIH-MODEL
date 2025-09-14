import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Play, Users, Building2, Target, Trophy } from 'lucide-react';

interface Allocation {
  id: string;
  student: {
    name: string;
    category: string;
  };
  internship: {
    company: string;
    role: string;
    sector: string;
  };
  score: number;
  reason: string;
}

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInternships: 0,
    totalAllocations: 0,
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      const [studentsRes, internshipsRes, allocationsRes] = await Promise.all([
        supabase.from('students').select('id'),
        supabase.from('internships').select('id'),
        supabase
          .from('allocations')
          .select(`
            id,
            score,
            reason,
            students!inner(name, category),
            internships!inner(company, role, sector)
          `)
      ]);

      const students = studentsRes.data || [];
      const internships = internshipsRes.data || [];
      const allocationsData = allocationsRes.data || [];

      const formattedAllocations: Allocation[] = allocationsData.map((alloc: any) => ({
        id: alloc.id,
        student: {
          name: alloc.students.name,
          category: alloc.students.category
        },
        internship: {
          company: alloc.internships.company,
          role: alloc.internships.role,
          sector: alloc.internships.sector
        },
        score: alloc.score,
        reason: alloc.reason
      }));

      setAllocations(formattedAllocations);
      setStats({
        totalStudents: students.length,
        totalInternships: internships.length,
        totalAllocations: formattedAllocations.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleRunAllocation = async () => {
    if (stats.totalStudents === 0) {
      toast({
        title: "No Students Found",
        description: "Please add some students before running allocation",
        variant: "destructive",
      });
      return;
    }

    if (stats.totalInternships === 0) {
      toast({
        title: "No Internships Found",
        description: "Please add some internships before running allocation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('allocate-internships');
      
      if (error) throw error;

      toast({
        title: "Allocation Complete!",
        description: "Successfully completed internship allocation",
        variant: "default",
      });
      
      await loadData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Allocation Failed",
        description: error?.message || "Failed to run allocation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'GEN': return 'bg-primary text-primary-foreground';
      case 'SC': return 'bg-secondary text-secondary-foreground';
      case 'ST': return 'bg-accent text-accent-foreground';
      case 'OBC': return 'bg-warning text-warning-foreground';
      case 'EWS': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-8 text-center">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">You need admin privileges to access this dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-surface border-border/50">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Admin Dashboard</CardTitle>
              <CardDescription>
                Manage internship allocation and view results
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-2xl font-semibold">{stats.totalStudents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Internships</p>
                  <p className="text-2xl font-semibold">{stats.totalInternships}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Allocations</p>
                  <p className="text-2xl font-semibold">{stats.totalAllocations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-semibold">
                    {stats.totalStudents > 0 ? Math.round((stats.totalAllocations / stats.totalStudents) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <Button 
            onClick={handleRunAllocation}
            disabled={loading}
            className="w-full md:w-auto bg-gradient-accent hover:opacity-90 text-white font-medium h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Allocation...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Run Allocation
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Table */}
      {allocations.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Allocation Results
            </CardTitle>
            <CardDescription>
              Latest internship allocation results with scoring details
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Organization & Role</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {allocation.student.name}
                      </TableCell>
                      <TableCell>{allocation.internship.company} - {allocation.internship.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {allocation.internship.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(allocation.score)}>
                          {allocation.score.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(allocation.student.category)}>
                          {allocation.student.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {allocation.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};