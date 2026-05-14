"use client";

import { useState } from "react";
import Link from "next/link";

const instructors = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Senior Web Developer",
    specialty: "Web Development",
    students: "12.4k",
    courses: 18,
    rating: 4.9,
    reviews: 3241,
    bio: "10+ years building scalable web apps at top Silicon Valley companies. Expert in React, Node.js, and cloud infrastructure.",
    tags: ["React", "Node.js", "TypeScript", "AWS"],
    avatar: "SM",
    color: "#FF6B35",
    featured: true,
  },
  {
    id: 2,
    name: "James Okafor",
    role: "Data Science Lead",
    specialty: "Data Science",
    students: "9.8k",
    courses: 14,
    rating: 4.8,
    reviews: 2178,
    bio: "PhD in Machine Learning from MIT. Built recommendation engines for Fortune 500 companies. Passionate about making AI accessible.",
    tags: ["Python", "TensorFlow", "ML", "Statistics"],
    avatar: "JO",
    color: "#4ECDC4",
    featured: true,
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "UX Design Director",
    specialty: "UI/UX Design",
    students: "7.2k",
    courses: 11,
    rating: 4.9,
    reviews: 1893,
    bio: "Former Design Lead at Google & Airbnb. Believes great design is invisible. Teaches the craft behind iconic digital experiences.",
    tags: ["Figma", "Prototyping", "User Research", "Design Systems"],
    avatar: "PS",
    color: "#A855F7",
    featured: false,
  },
  {
    id: 4,
    name: "Marcus Chen",
    role: "JavaScript Architect",
    specialty: "JavaScript",
    students: "15.1k",
    courses: 22,
    rating: 4.7,
    reviews: 4512,
    bio: "Open source contributor with 200k+ GitHub stars. Specializes in performance optimization and modern JavaScript patterns.",
    tags: ["JavaScript", "Vue", "Performance", "Testing"],
    avatar: "MC",
    color: "#F59E0B",
    featured: true,
  },
  {
    id: 5,
    name: "Elena Vasquez",
    role: "Cloud Infrastructure Expert",
    specialty: "DevOps",
    students: "5.9k",
    courses: 9,
    rating: 4.8,
    reviews: 1124,
    bio: "AWS Solutions Architect with 8 years in enterprise cloud migration. Simplifies complex infrastructure concepts for all skill levels.",
    tags: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    avatar: "EV",
    color: "#10B981",
    featured: false,
  },
  {
    id: 6,
    name: "David Kim",
    role: "Mobile App Developer",
    specialty: "Mobile Development",
    students: "8.3k",
    courses: 13,
    rating: 4.6,
    reviews: 2067,
    bio: "Built apps with 50M+ downloads on App Store & Play Store. Specializes in React Native and Flutter cross-platform development.",
    tags: ["React Native", "Flutter", "iOS", "Android"],
    avatar: "DK",
    color: "#3B82F6",
    featured: false,
  },
  {
    id: 7,
    name: "Amara Diallo",
    role: "Cybersecurity Specialist",
    specialty: "Security",
    students: "4.1k",
    courses: 7,
    rating: 4.9,
    reviews: 892,
    bio: "Ethical hacker and penetration tester. Worked with governments and banks to secure critical systems. Now sharing knowledge to build safer digital world.",
    tags: ["Ethical Hacking", "Network Security", "Cryptography", "OSINT"],
    avatar: "AD",
    color: "#EF4444",
    featured: false,
  },
  {
    id: 8,
    name: "Thomas Berger",
    role: "Blockchain Developer",
    specialty: "Blockchain",
    students: "3.7k",
    courses: 6,
    rating: 4.7,
    reviews: 734,
    bio: "Early Ethereum contributor and DeFi protocol architect. Breaks down complex Web3 concepts into practical, buildable projects.",
    tags: ["Solidity", "Web3", "DeFi", "Smart Contracts"],
    avatar: "TB",
    color: "#8B5CF6",
    featured: false,
  },
];

const specialties = ["All", "Web Development", "Data Science", "UI/UX Design", "JavaScript", "DevOps", "Mobile Development", "Security", "Blockchain"];

const stats = [
  { label: "Expert Instructors", value: "200+" },
  { label: "Total Students", value: "120k+" },
  { label: "Courses Created", value: "1,800+" },
  { label: "Avg. Rating", value: "4.8★" },
];

export default function InstructorsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const filtered = instructors.filter((inst) => {
    const matchesFilter = activeFilter === "All" || inst.specialty === activeFilter;
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1117]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                  <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                  <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                  <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
                </svg>
              </div>
              <span className="text-lg font-bold">
                Instructor<span className="text-[#FF6B35]">Studio</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["Courses", "Instructors", "Blog", "About Us", "Contact Us"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className={`text-sm transition-colors ${
                    item === "Instructors" ? "text-[#FF6B35] font-medium" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="5" />
                  <path d="M16 16l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-xs font-bold">SA</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B35]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#FF6B35]">Instructors</span>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-full px-4 py-1.5 text-sm text-[#FF6B35] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
              World-Class Educators
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
              Learn From The{" "}
              <span className="text-[#FF6B35]">Best Minds</span>{" "}
              In The Industry
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Our instructors are industry veterans who&apos;ve shaped the tech world. Real experience, real knowledge, real results.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#161B22] border border-white/5 rounded-2xl p-5 text-center">
                <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-10">
            <div className="relative w-full md:w-80">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="8" cy="8" r="5" />
                <path d="M16 16l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search instructors or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161B22] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setActiveFilter(spec)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === spec
                      ? "bg-[#FF6B35] text-white"
                      : "bg-[#161B22] text-gray-400 hover:text-white border border-white/5 hover:border-white/15"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 mb-8">
            Showing <span className="text-white font-semibold">{filtered.length}</span> instructors
          </p>

          {/* Instructors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((inst) => (
              <div
                key={inst.id}
                onMouseEnter={() => setHoveredCard(inst.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative bg-[#161B22] border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                  hoveredCard === inst.id
                    ? "border-[#FF6B35]/40 shadow-lg shadow-[#FF6B35]/10 -translate-y-1"
                    : "border-white/5"
                }`}
              >
                {inst.featured && (
                  <div className="absolute top-3 right-3 z-10 bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Featured
                  </div>
                )}

                {/* Top colored band */}
                <div
                  className="h-20 relative"
                  style={{ background: `linear-gradient(135deg, ${inst.color}22, ${inst.color}11)` }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 80% 50%, ${inst.color}44 0%, transparent 60%)`,
                    }}
                  />
                </div>

                {/* Avatar */}
                <div className="px-5 pb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg -mt-8 mb-3 border-2 border-[#161B22] shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${inst.color}, ${inst.color}88)` }}
                  >
                    {inst.avatar}
                  </div>

                  <div className="mb-3">
                    <h3 className="text-white font-bold text-lg leading-tight">{inst.name}</h3>
                    <p className="text-[#FF6B35] text-sm font-medium mt-0.5">{inst.role}</p>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">{inst.bio}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {inst.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-white/5 text-gray-300 text-[11px] px-2.5 py-1 rounded-lg border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-white text-sm font-bold">{inst.students}</div>
                      <div className="text-gray-500 text-[11px]">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white text-sm font-bold">{inst.courses}</div>
                      <div className="text-gray-500 text-[11px]">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#FF6B35] text-sm font-bold">★ {inst.rating}</div>
                      <div className="text-gray-500 text-[11px]">{inst.reviews.toLocaleString()} reviews</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="mt-4 w-full bg-white/5 hover:bg-[#FF6B35] border border-white/10 hover:border-[#FF6B35] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all duration-200">
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">No instructors found matching your search.</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}
                className="mt-4 text-[#FF6B35] hover:underline text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Become an Instructor CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#1A2030] to-[#161B22] border border-white/10 rounded-3xl overflow-hidden px-8 py-14 text-center">
            <div className="absolute inset-0 bg-[#FF6B35]/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4ECDC4]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
                Become an <span className="text-[#FF6B35]">Instructor</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Share your expertise with thousands of eager learners worldwide. Build your brand, earn income, and make an impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2 justify-center">
                  Apply to Teach
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                    <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                    <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                    <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
                  </svg>
                </div>
                <span className="font-bold">Instructor<span className="text-[#FF6B35]">Studio</span></span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed">Empowering learners through technology and creativity.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["Courses", "Instructors", "Blog", "About Us"].map((item) => (
                  <li key={item}><Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Explore</h4>
              <ul className="space-y-2">
                {["Upcoming Events", "FAQ", "Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}><Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>6391 Elgin St. Celina, Delaware 10299</li>
                <li>(303) 555-0105</li>
                <li>michael.mitc@example.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-600">
            © 2026 InstructorStudio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}