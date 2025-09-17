import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, User, MapPin, Briefcase } from 'lucide-react';

interface StudentFormData {
  name: string;
  marks: number;
  skills: string;
  category: 'GEN' | 'SC' | 'ST' | 'OBC' | 'EWS';
  location_pref: string;
  sector_pref: string;
}

export const StudentForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    marks: 0,
    skills: '',
    category: 'GEN',
    location_pref: '',
    sector_pref: '',
  });

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your application",
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation
    if (!formData.name || !formData.skills || !formData.location_pref || !formData.sector_pref) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.marks < 0 || formData.marks > 100) {
      toast({
        title: "Validation Error", 
        description: "Marks must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .insert([{
          ...formData,
          user_id: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Student application submitted successfully",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        name: '',
        marks: 0,
        skills: '',
        category: 'GEN',
        location_pref: '',
        sector_pref: '',
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Student Application</CardTitle>
            <CardDescription>
              Apply for internship opportunities that match your skills and preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Personal Information
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marks">Marks (%) *</Label>
                <Input
                  id="marks"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.marks || ''}
                  onChange={(e) => handleInputChange('marks', parseFloat(e.target.value) || 0)}
                  placeholder="Enter your percentage"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills *</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="e.g., Python, JavaScript, React"
                  required
                />
                <p className="text-xs text-muted-foreground">Separate multiple skills with commas</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value as StudentFormData['category'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GEN">General (GEN)</SelectItem>
                    <SelectItem value="SC">Scheduled Caste (SC)</SelectItem>
                    <SelectItem value="ST">Scheduled Tribe (ST)</SelectItem>
                    <SelectItem value="OBC">Other Backward Class (OBC)</SelectItem>
                    <SelectItem value="EWS">Economically Weaker Section (EWS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Preferences
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_pref">Preferred Location *</Label>
                <Input
                  id="location_pref"
                  value={formData.location_pref}
                  onChange={(e) => handleInputChange('location_pref', e.target.value)}
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector_pref">Preferred Sector *</Label>
                <Input
                  id="sector_pref"
                  value={formData.sector_pref}
                  onChange={(e) => handleInputChange('sector_pref', e.target.value)}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  required
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting Application...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Submit Application
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};