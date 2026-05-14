import Link from 'next/link';
import { ArrowRight, BookOpen, Award, Users, Star } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm mb-6">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              New courses added weekly
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              A Better Learning<br />
              <span className="text-gradient">Journey Starts Here</span>
            </h1>
            <p className="text-white/60 text-lg mb-8 max-w-lg">
              All the latest tools and technologies from the internet&apos;s most professional instructors, available to you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/courses" className="btn-primary flex items-center gap-2">
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register" className="btn-secondary">
                Join Free
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: BookOpen, label: '500+ Courses', color: 'text-blue-400' },
                { icon: Users, label: '10k+ Students', color: 'text-green-400' },
                { icon: Award, label: '98% Satisfaction', color: 'text-orange-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-orange-500/5 rounded-3xl blur-3xl" />
            <div className="relative card glow">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Web Development', icon: '💻', students: '3.2k' },
                  { title: 'Data Science', icon: '📊', students: '2.1k' },
                  { title: 'UI/UX Design', icon: '🎨', students: '1.8k' },
                  { title: 'Python', icon: '🐍', students: '4.5k' },
                ].map(({ title, icon, students }) => (
                  <div key={title} className="bg-[#0A1628] rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-white/40">{students} students</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-[#0A1628] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">JS</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">JavaScript Mastery</p>
                  <div className="progress-bar mt-1"><div className="progress-bar-fill" style={{ width: '72%' }} /></div>
                </div>
                <span className="text-orange-400 text-sm font-bold">72%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Key benefits that empower your learning</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: '🎯', title: 'Exclusive Coach', desc: 'Get one-on-one attention from world-class instructors at your convenience.' },
            { icon: '💡', title: 'Creative Minds', desc: 'Innovative instructors who teach you the skills you need.' },
            { icon: '📹', title: 'Video Tutorials', desc: 'Access a library of videos on demand, learn at your own pace.' },
            { icon: '🏆', title: 'World Record', desc: 'Award-winning courses that are globally recognized in education.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card text-center hover:border-orange-500/30 transition-colors group">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="font-semibold mb-2 group-hover:text-orange-400 transition-colors">{title}</h3>
              <p className="text-white/50 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="card bg-gradient-to-r from-[#1A3C5E] to-[#12203A] border-orange-500/20 text-center py-16">
          <h2 className="text-3xl font-bold mb-4">Start Your Free Learning Journey</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">Join thousands of students learning in-demand skills from world-class instructors.</p>
          <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E3250] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">Instructor<span className="text-orange-400">Studio</span></span>
            </div>
            <p className="text-white/40 text-sm">Empowering learners through technology and creativity.</p>
          </div>
          {[
            { title: 'Quick Links', links: ['Courses', 'Instructors', 'Blog', 'About Us'] },
            { title: 'Explore', links: ['Upcoming Events', 'FAQ', 'Privacy Policy', 'Terms of Service'] },
            { title: 'Contact', links: ['6391 Elgin St. Celina, Delaware 10299', '(303) 555-0105', 'michael.mitc@example.com'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map(l => <li key={l} className="text-white/40 text-sm hover:text-white/70 cursor-pointer transition-colors">{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto border-t border-[#1E3250] mt-8 pt-6 text-center text-white/30 text-sm">
          © {new Date().getFullYear()} InstructorStudio. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
