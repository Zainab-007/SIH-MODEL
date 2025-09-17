import React, { useState, useEffect } from 'react';
import { StudentForm } from '@/components/StudentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentData {
  id: string;
  name: string;
  marks: number;
  skills: string;
  category: string;
  location_pref: string;
  sector_pref: string;
  created_at: string;
}

interface AllocationData {
  student_id: string;
  internship: {
    company: string;
    role: string;
    sector: string;
  };
  score: number;
  reason: string;
}

const Students = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentError && studentError.code !== 'PGRST116') {
        throw studentError;
      }

      setStudentData(student);

      // If student exists, check for allocation
      if (student) {
        const { data: allocationData, error: allocationError } = await supabase
          .from('allocations')
          .select(`
            student_id,
            score,
            reason,
            internships!inner(company, role, sector)
          `)
          .eq('student_id', student.id)
          .single();

        if (allocationError && allocationError.code !== 'PGRST116') {
          console.error('Allocation error:', allocationError);
        } else if (allocationData) {
          setAllocation({
            student_id: allocationData.student_id,
            internship: {
              company: allocationData.internships.company,
              role: allocationData.internships.role,
              sector: allocationData.internships.sector
            },
            score: allocationData.score,
            reason: allocationData.reason
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load student data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudentData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Student data has been updated",
      variant: "default",
    });
  };

  const getStatusBadge = () => {
    if (!studentData) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Not Applied
        </Badge>
      );
    }
    
    if (allocation) {
      return (
        <Badge className="bg-success text-success-foreground flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Allocated
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending Allocation
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Student Portal</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge()}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Apply for internship opportunities and track your application status
        </p>
      </div>

      {/* Application Status */}
      {studentData && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{studentData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marks:</span>
                    <span className="font-medium">{studentData.marks}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{studentData.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skills:</span>
                    <span className="font-medium text-right">{studentData.skills}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Preferences</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{studentData.location_pref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sector:</span>
                    <span className="font-medium">{studentData.sector_pref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">
                      {new Date(studentData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Results */}
      {allocation && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Allocation Result
            </CardTitle>
            <CardDescription>
              Congratulations! You have been allocated to an internship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-success/5 border border-success/20 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-success">Internship Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Company:</span>
                      <span className="font-semibold text-lg">{allocation.internship.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <span className="font-medium">{allocation.internship.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sector:</span>
                      <Badge className="bg-success text-success-foreground">
                        {allocation.internship.sector}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-success">Match Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Match Score:</span>
                      <Badge className="bg-success text-success-foreground font-bold">
                        {allocation.score.toFixed(1)}/100
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Reason:</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">
                        {allocation.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Form */}
      {!studentData && (
        <div>
          <Card className="border-border/50 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Apply for Internship
              </CardTitle>
              <CardDescription>
                Fill out the form below to apply for internship opportunities
              </CardDescription>
            </CardHeader>
          </Card>
          <StudentForm />
        </div>
      )}
    </div>
  );
};

export default Students;