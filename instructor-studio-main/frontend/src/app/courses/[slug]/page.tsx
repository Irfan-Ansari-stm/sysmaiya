'use client';
import { useState } from 'react';
import { Star, Users, Clock, BookOpen, CheckCircle, Play, Lock, ShoppingCart, Loader2 } from 'lucide-react';
import { useCourse, useEnroll, useCreateOrder } from '../../../hooks';
import { useAuthStore } from '../../../store/auth.store';
import { Navbar } from '../../../components/layout/Navbar';
import { formatPrice, formatHours, formatDuration } from '../../../lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const { data: course, isLoading } = useCourse(params.slug);
  const { user, isAuthenticated } = useAuthStore();
  const { mutateAsync: enroll, isPending: enrolling } = useEnroll();
  const { mutateAsync: createOrder, isPending: ordering } = useCreateOrder();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }
  if (!course) return <div className="min-h-screen bg-[#0A1628] pt-24 text-center text-white/50">Course not found</div>;

  const isEnrolled = course.enrollment?.status === 'active' || course.enrollment?.status === 'completed';

  const handleEnroll = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (course.is_free || course.price === 0) {
      await enroll(course.id);
      router.push(`/courses/${course.slug}/learn`);
    } else {
      try {
        const { data } = await createOrder({ course_ids: [course.id], gateway: 'razorpay' });
        const order = data.data;
        // Open Razorpay checkout
        const win = window as any;
        if (win.Razorpay) {
          const rzp = new win.Razorpay({
            key: order.razorpay_key,
            amount: order.amount * 100,
            currency: order.currency,
            order_id: order.gateway_order_id,
            name: 'InstructorStudio',
            description: course.title,
            prefill: { email: user?.email },
            handler: async (response: any) => {
              const { paymentApi } = await import('../../../lib/api-services');
              await paymentApi.verifyPayment({ ...response, order_id: order.order_id, gateway: 'razorpay' });
              await enroll(course.id);
              toast.success('Payment successful! You are now enrolled.');
              router.push(`/courses/${course.slug}/learn`);
            },
            theme: { color: '#F97316' },
          });
          rzp.open();
        } else {
          toast.error('Payment system not loaded. Please try again.');
        }
      } catch {}
    }
  };

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || course.total_lessons;

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />
      {/* Hero */}
      <div className="pt-16 bg-gradient-to-b from-[#1A3C5E]/40 to-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              {course.category_name && (
                <span className="badge bg-orange-500/10 text-orange-400 mb-3">{course.category_name}</span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{course.title}</h1>
              {course.subtitle && <p className="text-white/60 text-lg mb-4">{course.subtitle}</p>}

              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(course.rating_avg) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                  ))}
                  <span className="ml-1 font-semibold">{course.rating_avg.toFixed(1)}</span>
                  <span className="text-white/40">({course.total_reviews} reviews)</span>
                </div>
                <span className="flex items-center gap-1 text-white/60"><Users className="w-4 h-4" />{course.total_students.toLocaleString()} students</span>
                <span className="flex items-center gap-1 text-white/60"><Clock className="w-4 h-4" />{formatHours(course.duration_hours)}</span>
                <span className="flex items-center gap-1 text-white/60"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
              </div>

              <p className="text-white/60 text-sm">Instructor: <span className="text-orange-400 font-medium">{course.instructor_name}</span></p>
            </div>

            {/* Sticky Purchase Card */}
            <div className="lg:col-span-1">
              <div className="card lg:sticky lg:top-24">
                <div className="h-48 bg-[#0A1628] rounded-xl overflow-hidden mb-4">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-white/10" /></div>
                  }
                </div>

                {course.is_free ? (
                  <p className="text-3xl font-bold text-green-400 mb-4">Free</p>
                ) : (
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-orange-400">{formatPrice(course.discount_price || course.price)}</p>
                    {course.discount_price && (
                      <p className="text-white/30 line-through">{formatPrice(course.price)}</p>
                    )}
                  </div>
                )}

                {isEnrolled ? (
                  <button onClick={() => router.push(`/courses/${course.slug}/learn`)} className="btn-primary w-full">
                    Continue Learning →
                  </button>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling || ordering}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {(enrolling || ordering) ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    {course.is_free ? 'Enroll for Free' : 'Buy Now'}
                  </button>
                )}

                <div className="mt-4 space-y-2 text-sm text-white/50">
                  <p>✓ Full lifetime access</p>
                  <p>✓ {totalLessons} lessons</p>
                  {course.certificate_enabled && <p>✓ Certificate of completion</p>}
                  <p>✓ {course.language} language</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* What you'll learn */}
          {course.what_you_learn?.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {course.what_you_learn.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum */}
          {course.sections?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Course Curriculum</h2>
              <div className="space-y-3">
                {course.sections.map((section) => (
                  <div key={section.id} className="card p-0 overflow-hidden">
                    <button
                      onClick={() => setOpenSections(prev =>
                        prev.includes(section.id) ? prev.filter(id => id !== section.id) : [...prev, section.id]
                      )}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <span className="font-medium text-sm">{section.title}</span>
                      <span className="text-white/40 text-xs">{section.lessons?.length || 0} lessons</span>
                    </button>
                    {openSections.includes(section.id) && section.lessons?.map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-t border-[#1E3250]">
                        {lesson.is_preview
                          ? <Play className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          : <Lock className="w-4 h-4 text-white/20 flex-shrink-0" />}
                        <span className="text-sm text-white/70 flex-1">{lesson.title}</span>
                        {lesson.duration_sec > 0 && (
                          <span className="text-xs text-white/30">{formatDuration(lesson.duration_sec)}</span>
                        )}
                        {lesson.is_preview && (
                          <span className="badge bg-orange-500/10 text-orange-400 text-xs">Preview</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {course.description && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">About this course</h2>
              <div className="text-white/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
