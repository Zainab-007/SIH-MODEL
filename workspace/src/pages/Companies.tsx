import React, { useState, useEffect } from 'react';
import { InternshipForm } from '@/components/InternshipForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  MapPin, 
  Users, 
  Briefcase,
  RefreshCw,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InternshipData {
  id: string;
  company: string;
  role: string;
  location: string;
  sector: string;
  required_skills: string;
  total_positions: number;
  quota_gen: number;
  quota_sc: number;
  quota_st: number;
  quota_obc: number;
  quota_ews: number;
  created_at: string;
}

const Companies = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [internships, setInternships] = useState<InternshipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error: any) {
      console.error('Failed to load internships:', error);
      toast({
        title: "Error",
        description: "Failed to load internships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInternships();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Internship data has been updated",
      variant: "default",
    });
  };

  const getTotalQuota = (internship: InternshipData) => {
    return internship.quota_gen + internship.quota_sc + internship.quota_st + 
           internship.quota_obc + internship.quota_ews;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Company Portal</h1>
          <div className="flex items-center gap-4">
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
            {profile?.role === 'admin' && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Internship
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage internship opportunities and view company postings
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Internships</p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '--' : internships.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold text-secondary">
                  {loading ? '--' : internships.reduce((sum, i) => sum + i.total_positions, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Companies</p>
                <p className="text-2xl font-bold text-accent">
                  {loading ? '--' : new Set(internships.map(i => i.company)).size}
                </p>
              </div>
              <div className="p-3 rounded-full bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Internship Form */}
      {showForm && profile?.role === 'admin' && (
        <div>
          <Card className="border-border/50 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Internship
              </CardTitle>
              <CardDescription>
                Create a new internship opportunity for student allocation
              </CardDescription>
            </CardHeader>
          </Card>
          <InternshipForm />
        </div>
      )}

      {/* Internships Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Available Internships
          </CardTitle>
          <CardDescription>
            Current internship opportunities posted by companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : internships.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Internships Posted</h3>
              <p className="text-muted-foreground">
                {profile?.role === 'admin' 
                  ? 'Click "Add Internship" to create the first opportunity'
                  : 'No internship opportunities are currently available'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Company & Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Skills Required</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internships.map((internship) => (
                    <TableRow key={internship.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <div className="font-semibold">{internship.company}</div>
                          <div className="text-sm text-muted-foreground">{internship.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{internship.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {internship.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{internship.total_positions}</div>
                          <div className="text-xs text-muted-foreground">
                            Quota: {getTotalQuota(internship)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {internship.required_skills}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(internship.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quota Breakdown for Admin */}
      {profile?.role === 'admin' && internships.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              Quota Breakdown
            </CardTitle>
            <CardDescription>
              Category-wise position distribution across all internships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {internships.reduce((sum, i) => sum + i.quota_gen, 0)}
                </div>
                <div className="text-sm text-muted-foreground">General</div>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {internships.reduce((sum, i) => sum + i.quota_sc, 0)}
                </div>
                <div className="text-sm text-muted-foreground">SC</div>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {internships.reduce((sum, i) => sum + i.quota_st, 0)}
                </div>
                <div className="text-sm text-muted-foreground">ST</div>
              </div>
              <div className="text-center p-4 bg-warning/5 rounded-lg">
                <div className="text-2xl font-bold text-warning">
                  {internships.reduce((sum, i) => sum + i.quota_obc, 0)}
                </div>
                <div className="text-sm text-muted-foreground">OBC</div>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {internships.reduce((sum, i) => sum + i.quota_ews, 0)}
                </div>
                <div className="text-sm text-muted-foreground">EWS</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Companies;