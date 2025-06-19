'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal'; // Adjust path if necessary
import HRCreateInterviewForm from '@/components/HRCreateInterviewForm'; // Adjust path if necessary

export default function HRDashboardPage() {
  const [userName, setUserName] = useState('HR User');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserName(userData.first_name || 'HR User');
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }
  }, []);

  const handleCreateInterviewSuccess = (newInterview: any) => {
    console.log('HR Interview created successfully:', newInterview);
    setIsModalOpen(false);
    // Future: refresh list of HR-created interviews or navigate.
    // e.g., router.refresh() or fetch HR interviews again.
  };


  const analyticsPlaceholders = [
    { id: 1, title: 'Total Interviews Created', value: '56', trend: '+12 this month', icon: '📝' },
    { id: 2, title: 'Candidates Processed', value: '128', trend: '+30 this month', icon: '👥' },
    { id: 3, title: 'Feedback Completion Rate', value: '85%', trend: '+5% this month', icon: '📊' },
    { id: 4, title: 'Average Time-to-Hire', value: '28 days', trend: '-3 days this month', icon: '⏳' },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {userName}!</h1>
          <p className="mt-2 text-gray-600">Monitor interview activities and candidate progress from your HR dashboard.</p>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out text-md inline-flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Interview
        </button>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {analyticsPlaceholders.map((metric) => (
            <div key={metric.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-gray-500">{metric.title}</h3>
                <span className="text-2xl">{metric.icon}</span>
              </div>
              <p className="text-4xl font-bold text-indigo-600 mb-1">{metric.value}</p>
              <p className="text-sm text-green-600 font-medium">{metric.trend}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                <h3 className="text-xl font-semibold text-indigo-700 mb-2">Manage Scheduled Interviews</h3>
                <p className="text-gray-600 mb-4">View existing interviews, invite candidates, and track progress.</p>
                <Link href="/hr/interviews" legacyBehavior>
                    <a className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out">
                        Go to My Interviews
                    </a>
                </Link>
            </div>
            {/* The primary "Schedule New Interview" button is now in the header section of this page.
                This card can be repurposed or removed if desired.
                For now, let's keep it as an alternative way to open the modal. */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Design & Schedule Interview</h3>
                    <p className="text-gray-600 mb-4">Create a new interview template or schedule one for specific candidates.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="self-start bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out">
                    Create Interview Template
                </button>
            </div>
          </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule or Design New Interview">
        <HRCreateInterviewForm
          onSuccess={handleCreateInterviewSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
