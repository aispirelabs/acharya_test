import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton'; // Path to LogoutButton

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: 'Dashboard', href: '/candidate' },
    { name: 'My Interviews', href: '/candidate/interviews' }, // Assuming this page will be created
    // { name: 'Create Interview', href: '/candidate/create-interview' }, // Placeholder for now
    { name: 'Profile', href: '/candidate/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white p-5 shadow-lg fixed top-0 left-0 h-full flex flex-col"> {/* Fixed Sidebar */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600">Acharya AI</h2>
          <p className="text-sm text-gray-500">Candidate Dashboard</p>
        </div>
        <nav className="space-y-3 flex-grow">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} legacyBehavior>
              <a className="flex items-center py-2.5 px-4 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium group">
                {/* Placeholder for icons if added later */}
                {/* <span className="mr-3">ICON</span>  */}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200"> {/* Logout button at the bottom */}
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 ml-60"> {/* Adjust ml to match sidebar width */}
        {children}
      </main>
    </div>
  );
}
