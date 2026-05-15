import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  MapPin, Building2, MessageCircle, CheckCircle2, Search,
  TrendingUp, Shield, Zap, Users, BarChart3, X, Loader2,
  ArrowRight, Map,
} from 'lucide-react'
import { loginUser, registerUser } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { loginSchema, type LoginFormData } from '@/lib/schemas/login.schema'
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth.schema'
import { cn } from '@/lib/utils'

type ModalType = 'login' | 'register' | null

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [modal, setModal] = useState<ModalType>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // Redirect already-logged-in users to their home
  useEffect(() => {
    if (!user) return
    const role = user.role.toUpperCase()
    if (role === 'OWNER') navigate('/owner/dashboard', { replace: true })
    else if (role === 'ADMIN') navigate('/admin', { replace: true })
    else navigate('/browse', { replace: true })
  }, [user, navigate])

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  // ESC closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (u) => {
      setAuth(u)
      setModal(null)
      const role = u.role.toUpperCase()
      if (role === 'OWNER') navigate('/owner/dashboard')
      else if (role === 'ADMIN') navigate('/admin')
      else navigate('/browse')
    },
  })

  // ── Register ─────────────────────────────────────────────────────────────
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  })
  const registerRole = registerForm.watch('role')
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => setRegisterSuccess(true),
  })

  function openModal(type: ModalType) {
    setRegisterSuccess(false)
    loginForm.reset()
    setModal(type)
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="landing-page font-sans">

      {/* ══════════════════════════════════════════════════════════════════
          NAV
        ══════════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b border-white/10"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AddKaro</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('login')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => openModal('register')}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/30"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
        ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -left-1/4 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '72px 72px' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 text-xs font-semibold tracking-wide"
              style={{ background: 'rgba(79,70,229,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
              India's Hoarding Marketplace
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Discover &amp; List<br />
              <span style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text' }}>
                Hoardings
              </span>{' '}
              Across India
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              AddKaro is India's first digital marketplace for outdoor advertising spaces.
              Browse verified hoardings, submit offers, and negotiate directly with owners — no brokers, no hassle.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => openModal('register')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
              >
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => openModal('login')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-slate-400">
              {['500+ verified listings', 'Bangalore & Delhi NCR', 'Direct owner chat'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating card mockup */}
          <div className="hidden lg:flex justify-end">
            <div className="relative w-80">
              {/* Main card */}
              <div className="rounded-2xl border border-white/20 p-5 shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-200" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">MG Road, Bangalore</p>
                    <p className="text-slate-400 text-xs">URBAN · 20×14 ft · Verified</p>
                  </div>
                </div>
                <div className="h-36 rounded-xl mb-4 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-14 h-14 text-indigo-700" />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Monthly Rental</p>
                    <p className="text-white font-bold text-xl">₹35,000</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400 text-xs font-semibold">Available</span>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  Submit Offer
                </button>
              </div>

              {/* Floating badge — nearby count */}
              <div className="absolute -top-4 -left-6 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.4)' }}>
                <Map className="w-4 h-4 text-indigo-400" />
                <span className="text-white text-xs font-semibold">12 hoardings nearby</span>
              </div>

              {/* Floating badge — offer sent */}
              <div className="absolute -bottom-4 -right-6 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(34,197,94,0.4)' }}>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-white text-xs font-semibold">Offer sent!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS
        ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }} className="py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Active Listings' },
            { value: '100+', label: 'Verified Owners' },
            { value: '2', label: 'Major Cities' },
            { value: '0', label: 'Middlemen' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
              <p className="text-indigo-200 text-sm mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROBLEM
        ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-widest mb-4">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Outdoor advertising was stuck in the past
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
              India has thousands of hoarding spaces with no digital layer. Advertisers relied on brokers, phone calls, and luck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                icon: Search,
                title: 'No central discovery',
                body: 'Advertisers had to physically scout locations or rely on brokers. No map, no search, no structured listings.',
                accent: '#f97316',
                bg: '#fff7ed',
              },
              {
                icon: BarChart3,
                title: 'Zero price transparency',
                body: 'Rental rates were negotiated blind. The same hoarding could be priced wildly differently for different buyers.',
                accent: '#ef4444',
                bg: '#fef2f2',
              },
              {
                icon: MessageCircle,
                title: 'Slow, manual deals',
                body: 'Negotiations required multiple in-person visits. Days or weeks wasted before a deal could even begin.',
                accent: '#eab308',
                bg: '#fefce8',
              },
            ].map(({ icon: Icon, title, body, accent, bg }) => (
              <div key={title} className="rounded-2xl p-8 border border-gray-100" style={{ background: '#fafafa' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: bg }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
        ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-widest mb-4">
              The Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything outdoor advertising needed
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg">
              A transparent, searchable marketplace with verified listings and direct owner communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: 'Smart Search & Filters',
                body: 'Filter by location, hoarding type, availability, and price range. Find your space in seconds, not days.',
                badge: 'Advertisers',
              },
              {
                icon: Map,
                title: 'Near Me Map Discovery',
                body: 'Interactive Leaflet map shows all hoardings within 15 km of any point. Click the map to explore.',
                badge: 'Advertisers',
              },
              {
                icon: Shield,
                title: 'Admin-Verified Listings',
                body: 'Every hoarding is reviewed before going live. Real photos, real dimensions, real prices — no fake listings.',
                badge: 'Trust',
              },
              {
                icon: MessageCircle,
                title: 'Direct Owner Chat',
                body: 'Submit an offer and start chatting with the owner instantly. Real-time negotiation without a broker.',
                badge: 'No Middlemen',
              },
              {
                icon: Building2,
                title: 'Owner Dashboard',
                body: 'List hoardings, track incoming offers, and manage your portfolio from a clean dashboard.',
                badge: 'Owners',
              },
              {
                icon: TrendingUp,
                title: 'Transparent Pricing',
                body: 'Published rental rates make the market fair. Submit counter-offers and negotiate confidently.',
                badge: 'Fair Market',
              },
            ].map(({ icon: Icon, title, body, badge }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full shrink-0">
                    {badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
        ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-widest mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple from first look to final deal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {/* Advertisers */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">For Advertisers</p>
              </div>
              <div className="space-y-7">
                {[
                  { n: '1', title: 'Search & Discover', body: 'Browse listings by city or explore the interactive Near Me map to find hoardings around any location.' },
                  { n: '2', title: 'Submit an Offer', body: 'Share your budget, campaign dates and message. No phone calls. No site visits before shortlisting.' },
                  { n: '3', title: 'Chat & Close', body: 'Connect directly with the owner via built-in chat. Negotiate and finalise on your own terms.' },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-brand-600/30">
                      {n}
                    </div>
                    <div className="pt-1">
                      <p className="font-bold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owners */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">For Hoarding Owners</p>
              </div>
              <div className="space-y-7">
                {[
                  { n: '1', title: 'List Your Space', body: 'Add photos, dimensions, coordinates and your rental price. Submit for admin review — approved in hours.' },
                  { n: '2', title: 'Get Discovered', body: 'Your listing appears on search results and the map to thousands of advertisers across India.' },
                  { n: '3', title: 'Review & Respond', body: 'Receive offers to your dashboard, chat directly with interested advertisers, and close deals digitally.' },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-slate-700 text-white font-extrabold text-sm flex items-center justify-center">
                      {n}
                    </div>
                    <div className="pt-1">
                      <p className="font-bold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA
        ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,#4f46e5,transparent)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-xl"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 16px 40px rgba(79,70,229,0.4)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to transform your outdoor advertising?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join hundreds of advertisers and owners already on the platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openModal('register')}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-white font-bold text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => openModal('login')}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/20 hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
        ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#020617' }} className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">AddKaro</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 AddKaro. India's outdoor advertising marketplace.</p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Bangalore</span>
            <span>·</span>
            <span>Delhi NCR</span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL
        ══════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="w-full max-w-md my-8 bg-white rounded-2xl shadow-2xl overflow-hidden lp-modal">

            {/* Modal header */}
            <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {modal === 'login' ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {modal === 'login' ? 'Sign in to your AddKaro account' : 'Free to join — no credit card needed'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-7 py-6">

              {/* ── LOGIN ────────────────────────────────────── */}
              {modal === 'login' && (
                <form
                  onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))}
                  noValidate
                  className="space-y-4"
                >
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={cn('input-field', loginForm.formState.errors.email && 'input-error')}
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="error-text">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      className={cn('input-field', loginForm.formState.errors.password && 'input-error')}
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="error-text">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  {loginMutation.isError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {loginMutation.error.message}
                    </div>
                  )}
                  <button type="submit" disabled={loginMutation.isPending} className="btn-primary">
                    {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
                  </button>
                  <p className="text-center text-sm text-gray-500 pt-1">
                    No account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setRegisterSuccess(false); setModal('register') }}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Sign up free
                    </button>
                  </p>
                </form>
              )}

              {/* ── REGISTER ──────────────────────────────────── */}
              {modal === 'register' && (
                <>
                  {registerSuccess ? (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Account created!</h3>
                      <p className="text-gray-500 text-sm mb-6">You can now sign in with your new credentials.</p>
                      <button
                        onClick={() => { setRegisterSuccess(false); setModal('login') }}
                        className="btn-primary"
                      >
                        Sign In Now
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))}
                      noValidate
                      className="space-y-4"
                    >
                      {/* Role toggle */}
                      <div>
                        <label className="label">I am a</label>
                        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
                          {(['customer', 'owner'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => registerForm.setValue('role', r, { shouldValidate: true })}
                              className={cn(
                                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all',
                                registerRole === r
                                  ? 'bg-white text-brand-600 shadow-sm font-bold'
                                  : 'text-gray-400 hover:text-gray-600',
                              )}
                            >
                              {r === 'customer' ? 'Advertiser' : 'Hoarding Owner'}
                            </button>
                          ))}
                        </div>
                        {registerForm.formState.errors.role && (
                          <p className="error-text">{registerForm.formState.errors.role.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Full Name</label>
                        <input
                          type="text"
                          autoComplete="name"
                          placeholder="Your full name"
                          className={cn('input-field', registerForm.formState.errors.name && 'input-error')}
                          {...registerForm.register('name')}
                        />
                        {registerForm.formState.errors.name && (
                          <p className="error-text">{registerForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Email Address</label>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={cn('input-field', registerForm.formState.errors.email && 'input-error')}
                          {...registerForm.register('email')}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="error-text">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={cn('input-field', registerForm.formState.errors.phone && 'input-error')}
                          {...registerForm.register('phone')}
                        />
                        {registerForm.formState.errors.phone && (
                          <p className="error-text">{registerForm.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Password</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          className={cn('input-field', registerForm.formState.errors.password && 'input-error')}
                          {...registerForm.register('password')}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="error-text">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      {registerMutation.isError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          {registerMutation.error.message}
                        </div>
                      )}
                      <button type="submit" disabled={registerMutation.isPending} className="btn-primary">
                        {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
                      </button>
                      <p className="text-center text-sm text-gray-500 pt-1">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setModal('login')}
                          className="font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Sign in
                        </button>
                      </p>
                    </form>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
