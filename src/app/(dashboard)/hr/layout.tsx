import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton'; // Adjust path if necessary, assuming @ is src/

export default function HRDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: 'Dashboard', href: '/hr' },
    { name: 'Manage Interviews', href: '/hr/interviews' }, // Assuming this page will be created
    // { name: 'Create Interview', href: '/hr/create-interview' }, // Placeholder for modal trigger or dedicated page
    { name: 'Profile', href: '/hr/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50"> {/* Slightly different bg for HR panel */}
      <aside className="w-64 bg-white p-6 shadow-xl fixed top-0 left-0 h-full flex flex-col z-40"> {/* Higher z-index for sidebar */}
        <div className="mb-8 text-left"> {/* Align title to left */}
            <h2 className="text-2xl font-bold text-indigo-700">Acharya AI</h2> {/* Different color scheme */}
            <p className="text-xs text-gray-500 mt-1">HR Administration Panel</p>
        </div>
        <nav className="space-y-2.5 flex-grow">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} legacyBehavior>
              <a className="flex items-center py-2.5 px-3.5 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-all duration-150 group">
                {/* Icon placeholder - can be added later */}
                {/* <span className="mr-3 w-5 h-5 text-gray-400 group-hover:text-indigo-600">ICON</span> */}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200"> {/* Logout button at the bottom */}
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 ml-64 bg-slate-50"> {/* Adjust ml to match sidebar width */}
        {children}
      </main>
    </div>
  );
}
