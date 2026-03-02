import { Link } from "wouter";
import { Activity, Shield, HeartPulse, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-8 h-8" />
            <span className="font-display font-bold text-2xl text-slate-900">WellA <span className="text-primary">app</span></span>
          </div>
          <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 font-semibold px-8">
            <a href="/api/login">Sign In / Register</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-generation Healthcare Portal
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Your health, <br/>
              <span className="text-gradient">reimagined.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
              Connect with top medical professionals, manage your prescriptions, and track your lab results—all in one secure, beautiful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all">
                <a href="/api/login">Get Started Today</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-slate-200 hover:bg-slate-50">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>

          <div className="relative animate-slide-up delay-200 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-teal-400/20 rounded-[3rem] transform rotate-3 scale-105 blur-2xl"></div>
            {/* landing page hero confident smiling doctor standing in modern clinic */}
            <img 
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2000&auto=format&fit=crop" 
              alt="Medical Professional" 
              className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl object-cover aspect-[4/3] border-4 border-white"
            />
            
            {/* Floating UI element */}
            <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">HIPAA Compliant</p>
                <p className="font-bold text-slate-900">100% Secure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Seamlessly bridging the gap between healthcare providers and patients with powerful digital tools.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Virtual Consultations", desc: "Book appointments and connect via secure Google Meet integration.", icon: Clock },
              { title: "Lab Results Storage", desc: "Keep all your medical records and lab results safely in one place.", icon: Activity },
              { title: "Digital Prescriptions", desc: "Receive and manage your prescriptions digitally without paper.", icon: HeartPulse },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
