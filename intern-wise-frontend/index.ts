import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Student {
  id: string;
  name: string;
  marks: number;
  skills: string;
  category: 'GEN' | 'SC' | 'ST' | 'OBC' | 'EWS';
  location_pref: string;
  sector_pref: string;
}

interface Internship {
  id: string;
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

interface Allocation {
  student_id: string;
  internship_id: string;
  score: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting allocation process...');

    // Clear previous allocations
    await supabaseClient.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Fetch students and internships
    const [studentsResponse, internshipsResponse] = await Promise.all([
      supabaseClient.from('students').select('*'),
      supabaseClient.from('internships').select('*')
    ]);

    if (studentsResponse.error) throw studentsResponse.error;
    if (internshipsResponse.error) throw internshipsResponse.error;

    const students: Student[] = studentsResponse.data || [];
    const internships: Internship[] = internshipsResponse.data || [];

    console.log(`Processing ${students.length} students and ${internships.length} internships`);

    const allocations: Allocation[] = [];
    const quotaTracker: Record<string, Record<string, number>> = {};

    // Initialize quota tracker
    internships.forEach(internship => {
      quotaTracker[internship.id] = {
        GEN: internship.quota_gen,
        SC: internship.quota_sc,
        ST: internship.quota_st,
        OBC: internship.quota_obc,
        EWS: internship.quota_ews
      };
    });

    // Sort students by marks (descending) for merit-based allocation
    students.sort((a, b) => b.marks - a.marks);

    for (const student of students) {
      let bestMatch: { internship: Internship; score: number; reason: string } | null = null;

      for (const internship of internships) {
        // Check if quota is available for this student's category
        if (quotaTracker[internship.id][student.category] <= 0) {
          continue;
        }

        // Calculate matching score
        let score = 0;
        let reasons: string[] = [];

        // Location preference match (30 points)
        if (internship.location.toLowerCase().includes(student.location_pref.toLowerCase()) ||
            student.location_pref.toLowerCase().includes(internship.location.toLowerCase())) {
          score += 30;
          reasons.push('Location match');
        }

        // Sector preference match (25 points)
        if (internship.sector.toLowerCase().includes(student.sector_pref.toLowerCase()) ||
            student.sector_pref.toLowerCase().includes(internship.sector.toLowerCase())) {
          score += 25;
          reasons.push('Sector match');
        }

        // Skills match (35 points)
        const studentSkills = student.skills.toLowerCase().split(',').map(s => s.trim());
        const requiredSkills = internship.required_skills.toLowerCase().split(',').map(s => s.trim());
        
        let skillMatches = 0;
        studentSkills.forEach(skill => {
          if (requiredSkills.some(req => req.includes(skill) || skill.includes(req))) {
            skillMatches++;
          }
        });

        if (skillMatches > 0) {
          const skillScore = Math.min(35, (skillMatches / requiredSkills.length) * 35);
          score += skillScore;
          reasons.push(`${skillMatches} skill matches`);
        }

        // Merit bonus (10 points based on marks)
        const meritScore = (student.marks / 100) * 10;
        score += meritScore;
        reasons.push(`Merit: ${student.marks}%`);

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            internship,
            score,
            reason: reasons.join(', ')
          };
        }
      }

      // Allocate to best match if found
      if (bestMatch && bestMatch.score > 20) { // Minimum threshold
        allocations.push({
          student_id: student.id,
          internship_id: bestMatch.internship.id,
          score: Math.round(bestMatch.score * 100) / 100,
          reason: bestMatch.reason
        });

        // Update quota
        quotaTracker[bestMatch.internship.id][student.category]--;
        console.log(`Allocated ${student.name} to ${bestMatch.internship.company} - ${bestMatch.internship.role} (Score: ${bestMatch.score})`);
      }
    }

    // Insert allocations into database
    if (allocations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('allocations')
        .insert(allocations);

      if (insertError) throw insertError;
    }

    console.log(`Allocation complete. ${allocations.length} students allocated.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully allocated ${allocations.length} students`,
        allocations: allocations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in allocate-internships function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});