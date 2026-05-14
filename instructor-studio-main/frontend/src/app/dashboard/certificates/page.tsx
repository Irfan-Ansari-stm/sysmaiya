'use client';
import { Award, Download, ExternalLink, BookOpen } from 'lucide-react';
import { useMyCertificates } from '../../../hooks';
import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { formatDate } from '../../../lib/utils';

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useMyCertificates();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-7 h-7 text-orange-400" />
            <div>
              <h1 className="text-2xl font-bold">My Certificates</h1>
              <p className="text-white/50 text-sm">{certificates?.length || 0} certificates earned</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-40" />
              ))}
            </div>
          ) : !certificates?.length ? (
            <div className="card text-center py-20">
              <Award className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No certificates yet</h3>
              <p className="text-white/40 text-sm mb-6">Complete a course to earn your first certificate!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {certificates.map((cert: any) => (
                <div key={cert.id} className="card hover:border-orange-500/30 transition-all group relative overflow-hidden">
                  {/* Decorative */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2">{cert.course_title}</h3>
                      <p className="text-white/40 text-xs mt-1">
                        Issued on {formatDate(cert.issued_at, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-orange-400/60 mt-0.5 font-mono">{cert.certificate_no}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {cert.pdf_url && (
                      <a href={cert.pdf_url} target="_blank" rel="noreferrer"
                        className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </a>
                    )}
                    <a href={`/verify/${cert.certificate_no}`} target="_blank" rel="noreferrer"
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
