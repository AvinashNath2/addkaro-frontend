import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  MapPin, Building2, MessageCircle, CheckCircle2,
  Shield, Users, BarChart3, X, Loader2,
  ArrowRight, Search, TrendingUp, Map,
} from 'lucide-react'
import { loginUser, registerUser } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { loginSchema, type LoginFormData } from '@/lib/schemas/login.schema'
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth.schema'
import { cn } from '@/lib/utils'

// ── Design tokens ─────────────────────────────────────────────────────────────
const Y = '#C9F31D'   // acid yellow — primary accent
const D = '#111111'   // near-black
const D2 = '#1a1a1a'  // card dark

type ModalType = 'login' | 'register' | null

// ── Scroll-animation hook ─────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          const delay = Number(el.dataset.delay ?? '0')
          setTimeout(() => el.classList.add('revealed'), delay)
          io.unobserve(el)
        }
      })
    }, { threshold: 0.08 })

    // Reveal already-visible elements immediately, observe the rest
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Already in viewport on mount — reveal with a tiny delay for paint
        const delay = Number((el as HTMLElement).dataset.delay ?? '0')
        setTimeout(() => (el as HTMLElement).classList.add('revealed'), delay + 80)
      } else {
        io.observe(el)
      }
    })

    return () => io.disconnect()
  }, [])
}

// ── City hoarding scene (SVG) ─────────────────────────────────────────────────
function HoardingScene() {
  return (
    <div className="hoarding-scene w-full h-full">
      <svg viewBox="0 0 700 860" fill="none" xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="sg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9F31D" stopOpacity="0.42"/>
            <stop offset="100%" stopColor="#C9F31D" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="sg2" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#C9F31D" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#C9F31D" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="sg3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6d6" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#fff6d6" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="sg4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0d0d"/>
            <stop offset="100%" stopColor="#0a0a0a"/>
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="700" height="860" fill="#0a0a0a"/>

        {/* Atmospheric glow from billboard screens */}
        <ellipse cx="448" cy="210" rx="230" ry="175" fill="url(#sg1)"/>

        {/* Far background buildings */}
        <rect x="0"   y="490" width="50"  height="370" fill="#111"/>
        <rect x="55"  y="455" width="65"  height="405" fill="#0f0f0f"/>
        <rect x="125" y="505" width="45"  height="355" fill="#111"/>
        <rect x="560" y="465" width="60"  height="395" fill="#0f0f0f"/>
        <rect x="628" y="492" width="72"  height="368" fill="#111"/>

        {/* Mid-ground left buildings */}
        <rect x="0"   y="345" width="98"  height="515" fill="#0d0d0d"/>
        <rect x="103" y="306" width="112" height="554" fill="#0e0e0e"/>
        <rect x="0"   y="345" width="98"  height="8"   fill="#080808"/>
        <rect x="103" y="306" width="112" height="8"   fill="#080808"/>
        {/* Left building 1 windows */}
        {[365, 388, 411, 434, 457, 480].flatMap(y =>
          [8, 22, 36, 52, 66, 80].map(x => (
            <rect key={`b1-${x}-${y}`} x={x} y={y} width={9} height={7}
              fill={y === 388 && x === 36 ? '#2c2a16' : y === 457 && x === 66 ? '#2a2814' : '#161616'}/>
          ))
        )}
        {/* Left building 2 windows */}
        {[320, 343, 366, 389, 412, 435, 458].flatMap(y =>
          [110, 128, 146, 164, 182, 198].map(x => (
            <rect key={`b2-${x}-${y}`} x={x} y={y} width={12} height={8}
              fill={y === 343 && x === 146 ? '#2e2c17' : y === 412 && x === 198 ? '#2a2814' : '#161616'}/>
          ))
        )}

        {/* Mid-ground right building */}
        <rect x="592" y="326" width="108" height="534" fill="#0d0d0d"/>
        <rect x="592" y="326" width="108" height="8"   fill="#080808"/>
        {[342, 365, 388, 411, 434, 457].flatMap(y =>
          [598, 616, 634, 652, 670, 688].map(x => (
            <rect key={`b3-${x}-${y}`} x={x} y={y} width={12} height={8}
              fill={y === 365 && x === 634 ? '#2c2a16' : y === 434 && x === 688 ? '#282713' : '#161616'}/>
          ))
        )}

        {/* Buildings behind billboard */}
        <rect x="292" y="440" width="118" height="320" fill="#0c0c0c"/>
        <rect x="518" y="455" width="68"  height="305" fill="#0c0c0c"/>

        {/* ─── BILLBOARD I-BEAM POLE ─── */}
        {/* Left flange */}
        <rect x="440" y="350" width="8" height="410" fill="#1d1d1d"/>
        {/* Right flange */}
        <rect x="456" y="350" width="8" height="410" fill="#1d1d1d"/>
        {/* Web stiffener plates */}
        {[415, 490, 565, 638, 712].map(y => (
          <rect key={`web-${y}`} x="440" y={y} width="24" height="5" fill="#181818"/>
        ))}
        {/* Metallic highlight strip */}
        <rect x="443" y="350" width="3" height="410" fill="#272727"/>
        {/* Base plates / foundation */}
        <rect x="428" y="754" width="48" height="12" fill="#171717"/>
        <rect x="420" y="762" width="64" height="8"  fill="#131313"/>
        <rect x="416" y="768" width="72" height="6"  fill="#101010"/>

        {/* Horizontal outrigger arms (pole to screen frame edges) */}
        <rect x="294" y="342" width="146" height="10" fill="#1b1b1b"/>
        <rect x="294" y="342" width="146" height="3"  fill="#232323"/>
        <rect x="464" y="342" width="146" height="10" fill="#1b1b1b"/>
        <rect x="464" y="342" width="146" height="3"  fill="#232323"/>
        {/* Diagonal truss braces */}
        <polygon points="440,342 294,348 298,358 444,352" fill="#181818"/>
        <polygon points="464,342 610,348 606,358 460,352" fill="#181818"/>

        {/* ─── BILLBOARD FRAME + SCREEN ─── */}
        {/* Structural outer frame */}
        <rect x="284" y="104" width="336" height="248" rx="3" fill="#0e0e0e"/>
        <rect x="284" y="104" width="336" height="248" rx="3" fill="none" stroke="#222" strokeWidth="8"/>
        {/* Screen face */}
        <rect x="296" y="116" width="312" height="224" rx="1" fill="#181818"/>
        {/* Screen glow wash */}
        <rect x="296" y="116" width="312" height="224" rx="1" fill="#C9F31D" opacity="0.042"/>
        {/* Screen border glow */}
        <rect x="296" y="116" width="312" height="224" rx="1" fill="none" stroke="#C9F31D" strokeWidth="2.2" opacity="0.62"/>
        {/* Corner mounting hardware */}
        <rect x="284" y="104" width="16" height="16" rx="1" fill="#181818" stroke="#232323" strokeWidth="1"/>
        <rect x="604" y="104" width="16" height="16" rx="1" fill="#181818" stroke="#232323" strokeWidth="1"/>
        <rect x="284" y="336" width="16" height="16" rx="1" fill="#181818" stroke="#232323" strokeWidth="1"/>
        <rect x="604" y="336" width="16" height="16" rx="1" fill="#181818" stroke="#232323" strokeWidth="1"/>
        <circle cx="292" cy="112" r="4" fill="#282828"/>
        <circle cx="612" cy="112" r="4" fill="#282828"/>
        <circle cx="292" cy="344" r="4" fill="#282828"/>
        <circle cx="612" cy="344" r="4" fill="#282828"/>

        {/* ─── AD CONTENT ON SCREEN ─── */}
        {/* Brand strip */}
        <rect x="312" y="130" width="145" height="30" rx="2" fill="#C9F31D" opacity="0.88"/>
        <rect x="320" y="137" width="108" height="10" rx="1" fill="#111" opacity="0.50"/>
        <rect x="320" y="149" width="76"  height="7"  rx="1" fill="#111" opacity="0.30"/>
        {/* Body copy lines */}
        <rect x="312" y="172" width="204" height="10" rx="1" fill="white" opacity="0.15"/>
        <rect x="312" y="188" width="162" height="10" rx="1" fill="white" opacity="0.11"/>
        <rect x="312" y="204" width="118" height="10" rx="1" fill="white" opacity="0.08"/>
        {/* Main creative block */}
        <rect x="312" y="224" width="192" height="92" rx="2" fill="#131313"/>
        <rect x="316" y="228" width="184" height="84" rx="1" fill="#C9F31D" opacity="0.06"/>
        <rect x="320" y="234" width="72"  height="70" rx="2" fill="#C9F31D" opacity="0.22"/>
        <rect x="402" y="234" width="88"  height="32" rx="1" fill="white"   opacity="0.055"/>
        <rect x="402" y="272" width="88"  height="32" rx="1" fill="white"   opacity="0.045"/>
        <rect x="410" y="240" width="54"  height="8"  rx="1" fill="#C9F31D" opacity="0.44"/>
        <rect x="410" y="254" width="40"  height="7"  rx="1" fill="white"   opacity="0.17"/>
        <rect x="410" y="267" width="46"  height="7"  rx="1" fill="white"   opacity="0.11"/>
        {/* Right info block */}
        <rect x="514" y="224" width="82"  height="92" rx="2" fill="#131313"/>
        <rect x="520" y="232" width="68"  height="8"  rx="1" fill="white"   opacity="0.10"/>
        <rect x="520" y="246" width="56"  height="8"  rx="1" fill="#C9F31D" opacity="0.40"/>
        <rect x="520" y="260" width="62"  height="8"  rx="1" fill="white"   opacity="0.08"/>
        <rect x="520" y="274" width="44"  height="8"  rx="1" fill="white"   opacity="0.06"/>
        <rect x="520" y="288" width="52"  height="20" rx="2" fill="#C9F31D" opacity="0.52"/>
        {/* CTA row */}
        <rect x="312" y="326" width="112" height="28" rx="2" fill="#C9F31D" opacity="0.82"/>
        <rect x="434" y="326" width="82"  height="28" rx="2" fill="white"   opacity="0.05"/>
        <rect x="526" y="326" width="68"  height="28" rx="2" fill="white"   opacity="0.04"/>
        <rect x="322" y="336" width="76"  height="8"  rx="1" fill="#111"    opacity="0.45"/>

        {/* ─── CATWALK / MAINTENANCE WALKWAY ─── */}
        <rect x="284" y="352" width="336" height="9" fill="#191919"/>
        <rect x="284" y="352" width="336" height="3" fill="#272727"/>
        <rect x="284" y="342" width="336" height="4" fill="#202020"/>
        {/* Railing posts */}
        {[290, 330, 370, 410, 450, 490, 530, 570, 610].map(x => (
          <rect key={`post-${x}`} x={x} y={342} width={4} height={19} fill="#1c1c1c"/>
        ))}

        {/* ─── SPOTLIGHT FIXTURES ON CATWALK ─── */}
        <rect x="308" y="351" width="26" height="12" rx="2" fill="#1c1c1c"/>
        <rect x="352" y="353" width="24" height="10" rx="2" fill="#1c1c1c"/>
        <rect x="506" y="351" width="26" height="12" rx="2" fill="#1c1c1c"/>
        <rect x="550" y="353" width="24" height="10" rx="2" fill="#1c1c1c"/>
        {/* Lens glows */}
        <circle cx="321" cy="351" r="8" fill="#C9F31D" opacity="0.48"/>
        <circle cx="364" cy="353" r="7" fill="#C9F31D" opacity="0.40"/>
        <circle cx="519" cy="351" r="8" fill="#C9F31D" opacity="0.48"/>
        <circle cx="562" cy="353" r="7" fill="#C9F31D" opacity="0.40"/>
        {/* Faint upward light beams */}
        <polygon points="315,351 327,351 323,116 319,116" fill="#C9F31D" opacity="0.022"/>
        <polygon points="358,353 370,353 368,116 356,116" fill="#C9F31D" opacity="0.018"/>
        <polygon points="513,351 525,351 521,116 517,116" fill="#C9F31D" opacity="0.022"/>
        <polygon points="556,353 568,353 564,116 552,116" fill="#C9F31D" opacity="0.018"/>

        {/* ─── STREET LAMPS ─── */}
        {/* Left lamp */}
        <rect x="242" y="544" width="8"  height="218" fill="#161616"/>
        <rect x="242" y="544" width="64" height="7"   fill="#161616"/>
        <rect x="300" y="544" width="8"  height="24"  fill="#161616"/>
        <rect x="292" y="530" width="24" height="16" rx="4" fill="#191919"/>
        <rect x="296" y="534" width="16" height="9"  rx="2" fill="#fff8e0" opacity="0.78"/>
        <ellipse cx="304" cy="546" rx="34" ry="24" fill="url(#sg3)" opacity="0.65"/>
        {/* Right lamp */}
        <rect x="624" y="558" width="8"  height="204" fill="#161616"/>
        <rect x="560" y="558" width="72" height="7"   fill="#161616"/>
        <rect x="560" y="558" width="8"  height="24"  fill="#161616"/>
        <rect x="550" y="544" width="24" height="16" rx="4" fill="#191919"/>
        <rect x="554" y="548" width="16" height="9"  rx="2" fill="#fff8e0" opacity="0.78"/>
        <ellipse cx="562" cy="560" rx="34" ry="24" fill="url(#sg3)" opacity="0.65"/>

        {/* ─── FOREGROUND BUILDINGS ─── */}
        {/* Left slab */}
        <rect x="0"   y="568" width="232" height="292" fill="#080808"/>
        <rect x="0"   y="568" width="232" height="12"  fill="#060606"/>
        {/* Rooftop equipment */}
        <rect x="8"   y="554" width="28" height="16" rx="1" fill="#0d0d0d"/>
        <rect x="42"  y="556" width="22" height="14" rx="1" fill="#0c0c0c"/>
        <rect x="70"  y="553" width="26" height="17" rx="1" fill="#0d0d0d"/>
        <rect x="102" y="555" width="20" height="15" rx="1" fill="#0c0c0c"/>
        {/* Water tank */}
        <rect x="158" y="547" width="32" height="25" rx="2" fill="#0d0d0d"/>
        <rect x="156" y="547" width="36" height="5"  rx="1" fill="#111"/>
        <rect x="163" y="570" width="4"  height="7"  fill="#0d0d0d"/>
        <rect x="183" y="570" width="4"  height="7"  fill="#0d0d0d"/>
        {/* Window grid */}
        {[588, 613, 638, 663].flatMap(y =>
          [12, 38, 64, 90, 116, 142, 168, 196].map(x => (
            <rect key={`fw-${x}-${y}`} x={x} y={y} width={18} height={13}
              fill={y === 613 && x === 38 ? '#252215' : y === 638 && x === 116 ? '#232014' : '#0e0e0e'}/>
          ))
        )}
        {/* Right slab */}
        <rect x="628" y="586" width="72"  height="274" fill="#080808"/>
        <rect x="628" y="586" width="72"  height="10"  fill="#060606"/>
        <rect x="632" y="574" width="22"  height="14" rx="1" fill="#0d0d0d"/>
        <rect x="660" y="576" width="18"  height="12" rx="1" fill="#0c0c0c"/>
        {[606, 628, 650, 672].flatMap(y =>
          [634, 652, 670, 688].map(x => (
            <rect key={`rw-${x}-${y}`} x={x} y={y} width={14} height={12}
              fill={y === 628 && x === 652 ? '#232114' : '#0e0e0e'}/>
          ))
        )}

        {/* ─── ROAD ─── */}
        <rect x="0" y="756" width="700" height="104" fill="url(#sg4)"/>
        {/* Sidewalks */}
        <rect x="0"   y="748" width="232" height="14" fill="#0f0f0f"/>
        <rect x="622" y="748" width="78"  height="14" fill="#0f0f0f"/>
        <rect x="0"   y="748" width="232" height="3"  fill="#1a1a1a"/>
        <rect x="622" y="748" width="78"  height="3"  fill="#1a1a1a"/>
        {/* Center double yellow lines */}
        <rect x="0" y="798" width="700" height="3" fill="#C9F31D" opacity="0.38"/>
        <rect x="0" y="805" width="700" height="3" fill="#C9F31D" opacity="0.38"/>
        {/* White dashed lane dividers */}
        {[0, 108, 216, 324, 432, 540, 648].map(x => (
          <rect key={`ld-${x}`} x={x} y={780} width={82} height={2} fill="white" opacity="0.20"/>
        ))}
        {/* Edge lines */}
        <rect x="0" y="760" width="700" height="2" fill="white" opacity="0.13"/>
        <rect x="0" y="854" width="700" height="2" fill="white" opacity="0.09"/>

        {/* ─── TRAFFIC LIGHT STREAKS ─── */}
        {/* Headlights (coming toward viewer) */}
        <ellipse cx="152" cy="828" rx="128" ry="7" fill="white" opacity="0.065"/>
        <ellipse cx="152" cy="828" rx="76"  ry="4" fill="white" opacity="0.09"/>
        <ellipse cx="84"  cy="828" rx="52"  ry="3" fill="white" opacity="0.055"/>
        {/* Taillights (moving away) */}
        <ellipse cx="568" cy="773" rx="108" ry="5" fill="#ff2222" opacity="0.09"/>
        <ellipse cx="568" cy="773" rx="58"  ry="3" fill="#ff3636" opacity="0.14"/>
        <ellipse cx="644" cy="773" rx="54"  ry="3" fill="#ff2222" opacity="0.08"/>

        {/* ─── GROUND GLOW FROM BILLBOARD ─── */}
        <ellipse cx="448" cy="760" rx="185" ry="26" fill="url(#sg2)" opacity="0.88"/>
        <ellipse cx="448" cy="772" rx="130" ry="17" fill="#C9F31D" opacity="0.04"/>
        <ellipse cx="450" cy="760" rx="38"  ry="9"  fill="#C9F31D" opacity="0.06"/>

      </svg>
    </div>
  )
}

// ── Counter animation ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const duration = 1800
        const start = performance.now()
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [target])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [modal, setModal] = useState<ModalType>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  useScrollReveal()

  useEffect(() => {
    if (!user) return
    const role = user.role.toUpperCase()
    if (role === 'OWNER') navigate('/owner/dashboard', { replace: true })
    else if (role === 'ADMIN') navigate('/admin', { replace: true })
    else navigate('/browse', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

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

  return (
    <>
      {/* ── Global animation styles ─────────────────────────────────────── */}
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
          will-change: transform, opacity;
        }
        [data-reveal="left"]  { transform: translateX(-40px); }
        [data-reveal="right"] { transform: translateX(40px); }
        [data-reveal="scale"] { transform: scale(0.93); }
        [data-reveal].revealed { opacity: 1 !important; transform: none !important; will-change: auto; }

        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(50px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatA {
          0%,100% { transform: rotate(45deg) translateY(0px); }
          50%     { transform: rotate(45deg) translateY(-14px); }
        }
        @keyframes floatB {
          0%,100% { transform: rotate(45deg) translateY(0px); }
          50%     { transform: rotate(45deg) translateY(12px); }
        }
        @keyframes marquee {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(201,243,29,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(201,243,29,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,243,29,0); }
        }
        html { scroll-behavior: smooth; }
        .hero-line-1 { animation: heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; will-change: transform, opacity; }
        .hero-line-2 { animation: heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s both; will-change: transform, opacity; }
        .hero-line-3 { animation: heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.30s both; will-change: transform, opacity; }
        .hero-line-4 { animation: heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.42s both; will-change: transform, opacity; }
        .hero-line-5 { animation: heroFade 0.9s ease 0.55s both; will-change: opacity; }
        .shape-a { animation: floatA 6s ease-in-out infinite; will-change: transform; }
        .shape-b { animation: floatB 8s ease-in-out infinite; will-change: transform; }
        .shape-c { animation: floatA 10s ease-in-out infinite 2s; will-change: transform; }
        .marquee-track { animation: marquee 28s linear infinite; will-change: transform; display: flex; width: max-content; }
        .pulse-dot { animation: pulse-ring 2.5s ease-out infinite; }

        @keyframes screenGlow {
          0%,100% { filter: brightness(1); }
          50%     { filter: brightness(1.18); }
        }
        .hoarding-scene { animation: screenGlow 4s ease-in-out infinite; will-change: filter; }

        .yk-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${Y}; color: ${D}; font-weight: 800;
          padding: 14px 32px; border-radius: 4px; font-size: 14px;
          letter-spacing: 0.03em; text-transform: uppercase;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .yk-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(201,243,29,0.4); }

        .yk-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: white; font-weight: 700;
          padding: 13px 28px; border-radius: 4px; font-size: 14px;
          letter-spacing: 0.03em; text-transform: uppercase;
          border: 2px solid rgba(255,255,255,0.25);
          transition: border-color 0.18s, background 0.18s;
        }
        .yk-btn-outline:hover { border-color: ${Y}; color: ${Y}; }

        .feat-card {
          background: #f9f9f9; border: 1px solid #ebebeb; border-radius: 4px;
          padding: 32px 28px; transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s;
        }
        .feat-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.09); border-color: ${Y}; }

        .step-num {
          width: 52px; height: 52px; border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 900; flex-shrink: 0;
          background: ${Y}; color: ${D};
        }
      `}</style>

      <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', color: D }}>

        {/* ══ NAV ══════════════════════════════════════════════════════════ */}
        <nav style={{ background: D, borderBottom: '1px solid #222' }}
          className="fixed top-0 inset-x-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: Y, borderRadius: 2 }}>
                <Building2 className="w-4 h-4" style={{ color: D }} />
              </div>
              <span className="text-lg font-black text-white tracking-tighter">AddKaro</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how" className="hover:text-white transition-colors">How It Works</a>
              <a href="#stats" className="hover:text-white transition-colors">Platform</a>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => openModal('login')}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2">
                Log In
              </button>
              <button onClick={() => openModal('register')} className="yk-btn" style={{ padding: '9px 20px', fontSize: 13 }}>
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* ══ HERO ═════════════════════════════════════════════════════════ */}
        <section style={{ background: D, minHeight: '100vh', paddingTop: 64 }}
          className="relative flex items-center overflow-hidden">

          {/* Background: grid texture + hoarding scene */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Grid texture */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
            {/* City hoarding scene — right half, desktop only */}
            <div className="absolute top-0 right-0 bottom-0 hidden lg:flex items-end" style={{ width: '50%', opacity: 0.92 }}>
              <HoardingScene />
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 w-full">
            <div className="max-w-4xl">

              {/* Label */}
              <div className="hero-line-1 flex items-center gap-2 mb-8">
                <span className="pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: Y }} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: Y }}>
                  India's Hoarding Aggregator Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-line-2 font-black leading-[0.95] tracking-tight mb-2"
                style={{ fontSize: 'clamp(52px,8vw,110px)', color: 'white' }}>
                Discover &amp;
              </h1>
              <h1 className="hero-line-3 font-black leading-[0.95] tracking-tight mb-8"
                style={{ fontSize: 'clamp(52px,8vw,110px)', color: Y }}>
                Book Hoardings.
              </h1>

              {/* Subheading */}
              <p className="hero-line-4 text-gray-400 leading-relaxed mb-10"
                style={{ fontSize: 'clamp(16px,2vw,20px)', maxWidth: 560 }}>
                One platform aggregating verified hoarding spaces across India. Browse,
                submit offers, and connect directly with owners — no brokers involved.
              </p>

              {/* CTAs */}
              <div className="hero-line-4 flex flex-wrap gap-4 mb-14">
                <button onClick={() => openModal('register')} className="yk-btn">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => openModal('login')} className="yk-btn-outline">
                  Sign In
                </button>
              </div>

              {/* Trust badges */}
              <div className="hero-line-5 flex flex-wrap gap-6">
                {[
                  { icon: CheckCircle2, text: '500+ verified listings' },
                  { icon: MapPin, text: 'Bangalore & Delhi NCR' },
                  { icon: Shield, text: 'Direct owner connect' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon className="w-4 h-4" style={{ color: Y }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ MARQUEE STRIP ════════════════════════════════════════════════ */}
        <div style={{ background: Y, padding: '14px 0', overflow: 'hidden', position: 'relative' }}>
          {/* Two identical sets — animation moves -50% for seamless loop */}
          <div className="marquee-track" style={{ alignItems: 'center' }}>
            {[...Array(2)].flatMap(() =>
              ['Outdoor Advertising', 'Hoardings', 'Billboards', 'LED Screens', 'Unipoles', 'No Brokers', 'Verified Owners', 'India'].map((t, i) => (
                <span key={`${t}-${i}`} className="font-black uppercase tracking-widest text-sm whitespace-nowrap"
                  style={{ color: D, padding: '0 32px' }}>
                  {t} <span style={{ opacity: 0.35, margin: '0 8px' }}>◆</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* ══ FEATURES ═════════════════════════════════════════════════════ */}
        <section id="features" style={{ background: 'white', padding: '100px 0' }}>
          <div className="max-w-7xl mx-auto px-6">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <p data-reveal className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: Y }}>
                  What We Offer
                </p>
                <h2 data-reveal data-delay="100"
                  className="font-black leading-tight"
                  style={{ fontSize: 'clamp(32px,5vw,56px)', color: D }}>
                  Everything you need<br />in one platform
                </h2>
              </div>
              <p data-reveal data-delay="200" className="text-gray-500 max-w-sm leading-relaxed text-sm">
                A transparent aggregator platform with verified listings and direct owner communication — built for India's outdoor advertising market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Search,        title: 'Smart Search',        body: 'Filter by city, type, size, price and availability. Find the perfect spot in seconds.',             delay: 0 },
                { icon: Map,           title: 'Near Me Map',          body: 'Interactive map shows all hoardings near any location. Click to explore at street level.',         delay: 80 },
                { icon: Shield,        title: 'Verified Listings',    body: 'Every hoarding reviewed by our admin team. Real photos, real dimensions, no fake listings.',       delay: 160 },
                { icon: MessageCircle, title: 'Direct Owner Chat',    body: 'Submit an offer and instantly chat with the owner. Real-time negotiation, zero brokers.',          delay: 240 },
                { icon: Building2,     title: 'Owner Dashboard',      body: 'List spaces, track offers, manage your portfolio — all in one clean dashboard.',                  delay: 320 },
                { icon: TrendingUp,    title: 'Transparent Pricing',  body: 'Published rates make the market fair. Submit counter-offers and negotiate with confidence.',       delay: 400 },
              ].map(({ icon: Icon, title, body, delay }) => (
                <div key={title} data-reveal data-delay={delay} className="feat-card">
                  <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ background: Y, borderRadius: 2 }}>
                    <Icon className="w-5 h-5" style={{ color: D }} />
                  </div>
                  <h3 className="font-black text-lg mb-3" style={{ color: D }}>{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STATS ════════════════════════════════════════════════════════ */}
        <section id="stats" style={{ background: D2, padding: '100px 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <p data-reveal className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-center" style={{ color: Y }}>
              By The Numbers
            </p>
            <h2 data-reveal data-delay="100"
              className="font-black text-white text-center mb-20"
              style={{ fontSize: 'clamp(28px,4vw,48px)' }}>
              A growing platform<br />you can trust
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: '#2a2a2a' }}>
              {[
                { value: 500, suffix: '+', label: 'Active Listings' },
                { value: 100, suffix: '+', label: 'Verified Owners' },
                { value: 2,   suffix: '',  label: 'Major Cities' },
                { value: 0,   suffix: '',  label: 'Brokerage Fees' },
              ].map(({ value, suffix, label }) => (
                <div key={label} data-reveal="scale"
                  className="flex flex-col items-center justify-center py-14 px-8"
                  style={{ background: D2 }}>
                  <p className="font-black leading-none mb-3" style={{ fontSize: 'clamp(48px,7vw,88px)', color: Y }}>
                    <AnimatedCounter target={value} suffix={suffix} />
                  </p>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PROBLEM ══════════════════════════════════════════════════════ */}
        <section style={{ background: 'white', padding: '100px 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p data-reveal className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: Y }}>
                  The Problem
                </p>
                <h2 data-reveal data-delay="100"
                  className="font-black leading-tight mb-6"
                  style={{ fontSize: 'clamp(28px,4vw,48px)', color: D }}>
                  Outdoor advertising<br />was stuck in the past.
                </h2>
                <p data-reveal data-delay="200" className="text-gray-500 leading-relaxed mb-8">
                  India has thousands of hoarding spaces with no digital layer. Advertisers relied on brokers,
                  phone calls, and luck. Owners had no way to reach the right buyers at scale.
                </p>
                <button data-reveal data-delay="300" onClick={() => openModal('register')} className="yk-btn">
                  Solve It Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Search,      title: 'No central discovery',   body: 'Advertisers physically scouted locations or hired brokers. No map, no search, no structure.',  n: '01' },
                  { icon: BarChart3,   title: 'Zero price transparency', body: 'Rental rates were negotiated blind. The same hoarding could be priced wildly differently.',    n: '02' },
                  { icon: MessageCircle, title: 'Slow, manual deals',   body: 'Negotiations required multiple in-person visits — days or weeks before a deal could begin.',    n: '03' },
                ].map(({ title, body, n }, i) => (
                  <div key={n} data-reveal data-delay={i * 100}
                    className="flex gap-5 p-6"
                    style={{ background: '#f9f9f9', border: '1px solid #ebebeb', borderRadius: 4 }}>
                    <span className="font-black text-2xl shrink-0" style={{ color: Y }}>{n}</span>
                    <div>
                      <h3 className="font-black mb-1" style={{ color: D }}>{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section id="how" style={{ background: D, padding: '100px 0' }}>
          <div className="max-w-7xl mx-auto px-6">
            <p data-reveal className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-center" style={{ color: Y }}>
              How It Works
            </p>
            <h2 data-reveal data-delay="100"
              className="font-black text-white text-center mb-20"
              style={{ fontSize: 'clamp(28px,4vw,48px)' }}>
              Simple from first look<br />to final deal
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Advertisers */}
              <div>
                <div data-reveal className="flex items-center gap-3 mb-10 pb-6" style={{ borderBottom: `2px solid ${Y}` }}>
                  <Users className="w-5 h-5" style={{ color: Y }} />
                  <p className="font-black uppercase tracking-widest text-sm text-white">For Advertisers</p>
                </div>
                <div className="space-y-8">
                  {[
                    { n: '01', title: 'Search & Discover', body: 'Browse listings by city or explore the interactive Near Me map to find hoardings around any location.' },
                    { n: '02', title: 'Submit an Offer',   body: 'Share your budget, campaign dates and message. No phone calls, no site visits before shortlisting.' },
                    { n: '03', title: 'Chat & Close',      body: 'Connect directly with the owner via built-in chat. Negotiate and finalise on your own terms.' },
                  ].map(({ n, title, body }, i) => (
                    <div key={n} data-reveal data-delay={i * 100} className="flex gap-5">
                      <div className="step-num shrink-0">{n}</div>
                      <div className="pt-2">
                        <p className="font-black text-white mb-1">{title}</p>
                        <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owners */}
              <div>
                <div data-reveal className="flex items-center gap-3 mb-10 pb-6" style={{ borderBottom: '2px solid #333' }}>
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <p className="font-black uppercase tracking-widest text-sm text-gray-400">For Hoarding Owners</p>
                </div>
                <div className="space-y-8">
                  {[
                    { n: '01', title: 'List Your Space',   body: 'Add photos, dimensions, coordinates and your rental price. Submit for review — approved in hours.' },
                    { n: '02', title: 'Get Discovered',    body: 'Your listing appears on search results and the map to thousands of advertisers across India.' },
                    { n: '03', title: 'Review & Respond',  body: 'Receive offers to your dashboard, chat with interested advertisers, and close deals digitally.' },
                  ].map(({ n, title, body }, i) => (
                    <div key={n} data-reveal data-delay={i * 100} className="flex gap-5">
                      <div className="step-num shrink-0" style={{ background: '#2a2a2a', color: 'white' }}>{n}</div>
                      <div className="pt-2">
                        <p className="font-black text-white mb-1">{title}</p>
                        <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA STRIP ════════════════════════════════════════════════════ */}
        <section style={{ background: Y, padding: '80px 0' }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <p data-reveal className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: D, opacity: 0.5 }}>
                Get Started Today
              </p>
              <h2 data-reveal data-delay="100"
                className="font-black leading-tight"
                style={{ fontSize: 'clamp(28px,4vw,52px)', color: D }}>
                Get a quote for your<br />upcoming campaign.
              </h2>
            </div>
            <div data-reveal="right" className="flex flex-col sm:flex-row gap-4 shrink-0">
              <button onClick={() => openModal('register')}
                className="inline-flex items-center gap-2 font-black uppercase tracking-wide text-sm px-8 py-4 transition-all hover:scale-105"
                style={{ background: D, color: Y, borderRadius: 4 }}>
                Create Free Account <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => openModal('login')}
                className="inline-flex items-center gap-2 font-black uppercase tracking-wide text-sm px-8 py-4 transition-all hover:opacity-70"
                style={{ background: 'transparent', color: D, borderRadius: 4, border: `2px solid ${D}` }}>
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1f1f1f', padding: '56px 0 32px' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center" style={{ background: Y, borderRadius: 2 }}>
                    <Building2 className="w-4 h-4" style={{ color: D }} />
                  </div>
                  <span className="font-black text-white text-lg tracking-tighter">AddKaro</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  India's hoarding aggregator platform — connecting advertisers with verified outdoor advertising owners. No brokers, no hassle.
                </p>
              </div>
              <div>
                <p className="font-black text-white text-xs uppercase tracking-widest mb-4">Cities</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>Bangalore</li>
                  <li>Delhi NCR</li>
                  <li>More coming soon</li>
                </ul>
              </div>
              <div>
                <p className="font-black text-white text-xs uppercase tracking-widest mb-4">Platform</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><button onClick={() => openModal('register')} className="hover:text-white transition-colors">Browse Hoardings</button></li>
                  <li><button onClick={() => openModal('register')} className="hover:text-white transition-colors">List Your Space</button></li>
                  <li><button onClick={() => openModal('login')} className="hover:text-white transition-colors">Sign In</button></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid #1f1f1f' }}>
              <p className="text-xs text-gray-600">© 2026 AddKaro. India's outdoor advertising aggregator platform.</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: Y }} />
                <span className="text-xs text-gray-600">Built in India</span>
              </div>
            </div>
          </div>
        </footer>

        {/* ══ MODAL ════════════════════════════════════════════════════════ */}
        {modal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
          >
            <div className="w-full max-w-md my-8 bg-white shadow-2xl overflow-hidden" style={{ borderRadius: 8 }}>
              <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: Y, borderRadius: 4 }}>
                    <Building2 className="w-5 h-5" style={{ color: D }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black" style={{ color: D }}>
                      {modal === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {modal === 'login' ? 'Sign in to your AddKaro account' : 'Free to join — no credit card needed'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setModal(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-7 py-6">
                {modal === 'login' && (
                  <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} noValidate className="space-y-4">
                    <div>
                      <label className="label">Email Address</label>
                      <input type="email" autoComplete="email" placeholder="you@example.com"
                        className={cn('input-field', loginForm.formState.errors.email && 'input-error')}
                        {...loginForm.register('email')} />
                      {loginForm.formState.errors.email && <p className="error-text">{loginForm.formState.errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <input type="password" autoComplete="current-password"
                        className={cn('input-field', loginForm.formState.errors.password && 'input-error')}
                        {...loginForm.register('password')} />
                      {loginForm.formState.errors.password && <p className="error-text">{loginForm.formState.errors.password.message}</p>}
                    </div>
                    {loginMutation.isError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {loginMutation.error.message}
                      </div>
                    )}
                    <button type="submit" disabled={loginMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-3 font-black uppercase tracking-wide text-sm transition-all hover:opacity-90"
                      style={{ background: Y, color: D, borderRadius: 4 }}>
                      {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
                    </button>
                    <p className="text-center text-sm text-gray-500 pt-1">
                      No account yet?{' '}
                      <button type="button" onClick={() => { setRegisterSuccess(false); setModal('register') }}
                        className="font-black" style={{ color: D }}>Sign up free</button>
                    </p>
                  </form>
                )}

                {modal === 'register' && (
                  <>
                    {registerSuccess ? (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: Y }}>
                          <CheckCircle2 className="w-7 h-7" style={{ color: D }} />
                        </div>
                        <h3 className="text-lg font-black mb-2" style={{ color: D }}>Account created!</h3>
                        <p className="text-gray-500 text-sm mb-6">You can now sign in with your new credentials.</p>
                        <button onClick={() => { setRegisterSuccess(false); setModal('login') }}
                          className="w-full py-3 font-black uppercase tracking-wide text-sm"
                          style={{ background: Y, color: D, borderRadius: 4 }}>
                          Sign In Now
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} noValidate className="space-y-4">
                        <div>
                          <label className="label">I am a</label>
                          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
                            {(['customer', 'owner'] as const).map((r) => (
                              <button key={r} type="button"
                                onClick={() => registerForm.setValue('role', r, { shouldValidate: true })}
                                className={cn('flex-1 py-2.5 px-4 rounded-lg text-sm font-bold capitalize transition-all',
                                  registerRole === r ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                )}
                                style={registerRole === r ? { color: D } : {}}>
                                {r === 'customer' ? 'Customer' : 'Hoarding Owner'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {['name','email','phone','password'].map((field) => (
                          <div key={field}>
                            <label className="label">
                              {field === 'name' ? 'Full Name' : field === 'email' ? 'Email Address' : field === 'phone' ? 'Phone Number' : 'Password'}
                            </label>
                            <input
                              type={field === 'email' ? 'email' : field === 'password' ? 'password' : field === 'phone' ? 'tel' : 'text'}
                              autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'new-password'}
                              maxLength={field === 'phone' ? 10 : undefined}
                              placeholder={field === 'name' ? 'Your full name' : field === 'email' ? 'you@example.com' : field === 'phone' ? '10-digit mobile' : 'At least 6 characters'}
                              className={cn('input-field', (registerForm.formState.errors as Record<string, {message?: string}>)[field] && 'input-error')}
                              {...registerForm.register(field as 'name' | 'email' | 'phone' | 'password')}
                            />
                            {(registerForm.formState.errors as Record<string, {message?: string}>)[field] && (
                              <p className="error-text">{(registerForm.formState.errors as Record<string, {message?: string}>)[field]?.message}</p>
                            )}
                          </div>
                        ))}
                        {registerMutation.isError && (
                          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {registerMutation.error.message}
                          </div>
                        )}
                        <button type="submit" disabled={registerMutation.isPending}
                          className="w-full flex items-center justify-center gap-2 py-3 font-black uppercase tracking-wide text-sm"
                          style={{ background: Y, color: D, borderRadius: 4 }}>
                          {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                          {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
                        </button>
                        <p className="text-center text-sm text-gray-500 pt-1">
                          Already have an account?{' '}
                          <button type="button" onClick={() => setModal('login')}
                            className="font-black" style={{ color: D }}>Sign in</button>
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
    </>
  )
}
