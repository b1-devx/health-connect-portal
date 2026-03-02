import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, FileText, Pill, Users, Home, Bell, LogOut, Menu, X, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isDoctor = profile?.role === "doctor";

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Lab Results", href: "/lab-results", icon: Activity },
    { name: "Prescriptions", href: "/prescriptions", icon: Pill },
    { name: "Requests", href: "/requests", icon: Bell },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  if (isDoctor) {
    navigation.splice(1, 0, { name: "Patients", href: "/patients", icon: Users });
  }

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-slate-600 hover:bg-primary/5 hover:text-primary"
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-slate-400"}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-6 h-6" />
          <span className="font-display font-bold text-lg">WellA app</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-border shadow-xl shadow-slate-200/50 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:flex md:flex-col
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-slate-800">WellA <span className="text-primary">app</span></span>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
            <img 
              src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0D8BFF&color=fff`} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {isDoctor ? "Dr. " : ""}{user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role || "User"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto medical-gradient min-h-screen">
        {children}
      </main>
    </div>
  );
}
