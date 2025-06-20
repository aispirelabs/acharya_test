
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidateDashboard from "@/components/candidate/CandidateDashboard";
import HRDashboard from "@/components/hr/HRDashboard";

export default function DashboardPage() {
  const [userType, setUserType] = useState<'candidate' | 'hr' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real app, this would come from auth context or API
    // For now, we'll simulate checking user type
    const checkUserType = async () => {
      try {
        // Simulate API call to get user info
        const userType = localStorage.getItem('userType') as 'candidate' | 'hr' || 'candidate';
        setUserType(userType);
      } catch (error) {
        console.error('Error checking user type:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userType === 'hr') {
    return <HRDashboard />;
  }

  return <CandidateDashboard />;
}
