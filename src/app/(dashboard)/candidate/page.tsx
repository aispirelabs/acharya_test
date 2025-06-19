'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal'; // Adjust path if necessary
import CreateInterviewForm from '@/components/CreateInterviewForm'; // Adjust path if necessary

export default function CandidateDashboardPage() {
  const [userName, setUserName] = useState('Candidate');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserName(userData.first_name || 'Candidate');
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }
  }, []);

  const handleCreateInterviewSuccess = (newInterview: any) => {
    console.log('Interview created successfully:', newInterview);
    setIsModalOpen(false);
    // Here you might want to refresh the list of interviews or navigate,
    // for now, just logging and closing modal.
    // e.g., router.refresh() or fetch interviews again.
  };

  const recentInterviews = [
    { id: 1, title: 'Software Engineer - Backend Focus', date: '2024-03-10', type: 'Technical' },
    { id: 2, title: 'Product Manager - Behavioral Prep', date: '2024-03-12', type: 'Behavioral' },
    { id: 3, title: 'Data Scientist - Mock Interview', date: '2024-03-15', type: 'Technical' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome message & Create button */}
      <div className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {userName}!</h1>
          <p className="mt-2 text-gray-600">Here&apos;s a summary of your recent activity and quick access to practice more.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out text-lg"
        >
          + Create New Interview
        </button>
      </div>

      {/* Recent Interviews Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Your Recent Interviews</h2>
            {/* <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out">
                View All Interviews
            </button> */}
        </div>
        {recentInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentInterviews.map((interview) => (
              <div key={interview.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{interview.title}</h3>
                <p className="text-gray-500 text-sm mb-1">Type: <span className="font-medium text-gray-700">{interview.type}</span></p>
                <p className="text-gray-500 text-sm mb-4">Date: <span className="font-medium text-gray-700">{interview.date}</span></p>
                <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150">
                  Review Feedback
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500 text-center">You haven&apos;t completed any interviews yet. Start practicing now!</p>
          </div>
        )}
      </section>

      {/* Quick Actions Section - Optional (can be removed if Create button is prominent) */}
      {/* <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <h3 className="text-xl font-semibold text-purple-700 mb-2">Practice a New Interview</h3>
                <p className="text-gray-600 mb-4">Sharpen your skills by starting a new mock interview session tailored to your needs.</p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out">
                    Start New Interview
                </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <h3 className="text-xl font-semibold text-teal-700 mb-2">Explore Interview Types</h3>
                <p className="text-gray-600 mb-4">Learn about different interview formats and get tips for technical and behavioral questions.</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out">
                    Learn More
                </button>
            </div>
        </div>
      </section> */}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Interview">
        <CreateInterviewForm
          onSuccess={handleCreateInterviewSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
