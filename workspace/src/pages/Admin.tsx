import React from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Shield, AlertTriangle } from 'lucide-react';

const Admin = () => {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">
              You need administrator privileges to access this panel. Please contact your system administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage Optima — Where Talent Meets Opportunity
            </p>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            Administrator Access
          </CardTitle>
          <CardDescription>
            You have full administrative privileges to manage students, internships, and run allocation algorithms.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Dashboard */}
      <AdminDashboard />
    </div>
  );
};

export default Admin;