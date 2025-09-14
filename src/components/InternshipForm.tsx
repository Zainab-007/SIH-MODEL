import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Users, Briefcase } from 'lucide-react';

interface InternshipFormData {
  company: string;
  role: string;
  location: string;
  sector: string;
  required_skills: string;
  quota_gen: number;
  quota_sc: number;
  quota_st: number;
  quota_obc: number;
  quota_ews: number;
  total_positions: number;
}

export const InternshipForm: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InternshipFormData>({
    company: '',
    role: '',
    location: '',
    sector: '',
    required_skills: '',
    quota_gen: 0,
    quota_sc: 0,
    quota_st: 0,
    quota_obc: 0,
    quota_ews: 0,
    total_positions: 0,
  });

  const handleInputChange = (field: keyof InternshipFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can add internships",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.company || !formData.role || !formData.location || !formData.sector || !formData.required_skills) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.total_positions < 1) {
      toast({
        title: "Validation Error",
        description: "Total positions must be at least 1",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('internships')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Internship opportunity added successfully",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        company: '',
        role: '',
        location: '',
        sector: '',
        required_skills: '',
        quota_gen: 0,
        quota_sc: 0,
        quota_st: 0,
        quota_obc: 0,
        quota_ews: 0,
        total_positions: 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add internship",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-8 text-center">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">You need admin privileges to add internship opportunities.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-accent">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Add Internship Opportunity</CardTitle>
            <CardDescription>
              Create new internship positions for student allocation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., Software Developer, Marketing Intern"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Mumbai, Delhi, Remote"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                placeholder="e.g., Technology, Finance, Healthcare"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="required_skills">Required Skills *</Label>
            <Input
              id="required_skills"
              value={formData.required_skills}
              onChange={(e) => handleInputChange('required_skills', e.target.value)}
              placeholder="e.g., Python, JavaScript, Communication"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Quota Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quota_gen">General</Label>
                <Input
                  id="quota_gen"
                  type="number"
                  min="0"
                  value={formData.quota_gen || ''}
                  onChange={(e) => handleInputChange('quota_gen', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quota_sc">SC</Label>
                <Input
                  id="quota_sc"
                  type="number"
                  min="0"
                  value={formData.quota_sc || ''}
                  onChange={(e) => handleInputChange('quota_sc', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quota_st">ST</Label>
                <Input
                  id="quota_st"
                  type="number"
                  min="0"
                  value={formData.quota_st || ''}
                  onChange={(e) => handleInputChange('quota_st', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quota_obc">OBC</Label>
                <Input
                  id="quota_obc"
                  type="number"
                  min="0"
                  value={formData.quota_obc || ''}
                  onChange={(e) => handleInputChange('quota_obc', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quota_ews">EWS</Label>
                <Input
                  id="quota_ews"
                  type="number"
                  min="0"
                  value={formData.quota_ews || ''}
                  onChange={(e) => handleInputChange('quota_ews', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_positions">Total Positions *</Label>
                <Input
                  id="total_positions"
                  type="number"
                  min="1"
                  value={formData.total_positions || ''}
                  onChange={(e) => handleInputChange('total_positions', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-accent hover:opacity-90 text-white font-medium h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding Internship...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Add Internship
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};