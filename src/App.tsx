import { useState } from 'react'
import TinyTalkersApp from './products/TinyTalkersApp'
import TimekeepingApp from './products/TimekeepingApp'

// Oikos Technologies landing page — matches reference design

function OikosLogo() {
  return (
    <img
      src="/src/assets/logo.png"
      alt="Oikos Technologies"
      style={{ width: 120, height: 'auto' }}
    />
  )
}

function TinyTalkersIcon() {
  return (
    <svg width="80" height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left speech bubble */}
      <rect x="2" y="4" width="36" height="26" rx="6" fill="#1E88E5" />
      <polygon points="10,30 6,40 20,30" fill="#1E88E5" />
      {/* Right speech bubble */}
      <rect x="28" y="0" width="48" height="28" rx="6" fill="#1E88E5" />
      <polygon points="66,28 72,38 56,28" fill="#1E88E5" />
      {/* Dots inside bubbles */}
      <circle cx="16" cy="17" r="3" fill="white" />
      <circle cx="26" cy="17" r="3" fill="white" />
      <circle cx="36" cy="17" r="3" fill="white" />
      {/* People silhouettes */}
      <circle cx="22" cy="55" r="8" fill="#1E88E5" />
      <path d="M6 70 Q6 58 22 58 Q38 58 38 70" fill="#1E88E5" />
      <circle cx="50" cy="52" r="8" fill="#1E88E5" />
      <path d="M34 70 Q34 58 50 58 Q66 58 66 70" fill="#1E88E5" />
    </svg>
  )
}

function TimeKeepingIcon() {
  return (
    <svg width="80" height="72" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clock circle */}
      <circle cx="28" cy="30" r="26" fill="none" stroke="#C8A000" strokeWidth="4" />
      <circle cx="28" cy="30" r="3" fill="#C8A000" />
      {/* Clock hands */}
      <line x1="28" y1="30" x2="28" y2="12" stroke="#C8A000" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="28" y1="30" x2="42" y2="38" stroke="#C8A000" strokeWidth="3.5" strokeLinecap="round" />
      {/* Calendar card */}
      <rect x="40" y="30" width="36" height="38" rx="5" fill="#C8A000" />
      <rect x="40" y="30" width="36" height="12" rx="5" fill="#9A7800" />
      {/* Calendar rings */}
      <rect x="50" y="26" width="4" height="10" rx="2" fill="#9A7800" />
      <rect x="62" y="26" width="4" height="10" rx="2" fill="#9A7800" />
      {/* Calendar grid dots */}
      <rect x="46" y="46" width="5" height="5" rx="1" fill="white" />
      <rect x="55" y="46" width="5" height="5" rx="1" fill="white" />
      <rect x="64" y="46" width="5" height="5" rx="1" fill="white" />
      <rect x="46" y="56" width="5" height="5" rx="1" fill="white" />
      <rect x="55" y="56" width="5" height="5" rx="1" fill="white" />
    </svg>
  )
}

function GradebookIcon() {
  return (
    <svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Spiral binding */}
      <rect x="14" y="4" width="52" height="72" rx="6" fill="#388E3C" />
      {/* Spiral rings */}
      {[12, 24, 36, 48, 60].map(y => (
        <ellipse key={y} cx="18" cy={y} rx="6" ry="5" fill="none" stroke="#2E7D32" strokeWidth="3" />
      ))}
      {/* Lines */}
      <line x1="26" y1="18" x2="56" y2="18" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="26" y1="30" x2="56" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="26" y1="42" x2="48" y2="42" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* Checkmarks */}
      <path d="M26 55 L31 61 L42 50" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M26 66 L31 72 L42 61" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Pencil */}
      <rect x="54" y="38" width="8" height="28" rx="2" fill="#FDD835" transform="rotate(-20 58 52)" />
      <polygon points="60,62 56,68 64,68" fill="#FF8F00" transform="rotate(-20 60 65)" />
    </svg>
  )
}

const PRODUCTS = [
  {
    name: 'TinyTalkers',
    nameHighlight: 'Tiny',
    highlightColor: '#1E88E5',
    description: 'Pre-school vocabulary and word learning platform.',
    buttonLabel: 'Launch TinyTalkers',
    buttonColor: '#1E88E5',
    Icon: TinyTalkersIcon,
  },
  {
    name: 'Time Keeping App',
    nameHighlight: 'Time',
    highlightColor: '#C8A000',
    description: 'Efficient attendance recording and time tracking.',
    buttonLabel: 'Launch App',
    buttonColor: '#C8A000',
    Icon: TimeKeepingIcon,
  },
  {
    name: 'Gradebook',
    nameHighlight: null,
    highlightColor: '#388E3C',
    description: 'Comprehensive grade recording and academic tracking.',
    buttonLabel: 'Launch Gradebook',
    buttonColor: '#388E3C',
    Icon: GradebookIcon,
  },
]

// ── Shared page shell ────────────────────────────────────────────────────────

function PageShell({ children, onNav }: { children: React.ReactNode; onNav: (page: string) => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #eef3f8 0%, #f7f4ec 60%, #f0ede4 100%)',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(100,140,200,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,140,200,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          maxWidth: 900,
          margin: '0 auto',
          padding: '56px 24px 0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {children}

        {/* Shared footer */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '32px 0 28px',
            marginTop: 48,
            borderTop: '1px solid rgba(0,0,0,0.07)',
            fontSize: 13,
            color: '#888',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <nav style={{ display: 'flex', gap: 20 }}>
            {['Contact', 'About'].map(label => (
              <a
                key={label}
                href="#"
                onClick={e => { e.preventDefault(); onNav(label) }}
                style={{ color: '#888', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#333')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#888')}
              >
                {label}
              </a>
            ))}
          </nav>
          <span>© Oikos Technologies</span>
        </footer>
      </div>
    </div>
  )
}

// ── Landing page ─────────────────────────────────────────────────────────────

function LandingPage({ onNav, onLaunch }: { onNav: (page: string) => void; onLaunch: (product: string) => void }) {
  return (
    <PageShell onNav={onNav}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <OikosLogo />
      </div>

      {/* Hero text */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            color: '#111',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}
        >
          Oikos Technologies:<br />
          A Unified Educational Ecosystem.
        </h1>
        <p style={{ fontSize: 16, color: '#555', margin: 0, fontWeight: 400 }}>
          Explore our specialized platforms. Access all our solutions below.
        </p>
      </div>

      {/* Product cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 'auto',
        }}
      >
        {PRODUCTS.map(product => {
          const { Icon } = product
          return (
            <div
              key={product.name}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '36px 28px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                gap: 16,
              }}
            >
              <div style={{ height: 80, display: 'flex', alignItems: 'center' }}>
                <Icon />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.25 }}>
                {product.nameHighlight ? (
                  <>
                    <span style={{ color: product.highlightColor }}>{product.nameHighlight}</span>
                    {product.name.slice(product.nameHighlight.length)}
                  </>
                ) : product.name}
              </h2>
              <p style={{ fontSize: 15, color: '#555', margin: 0, lineHeight: 1.6, flex: 1 }}>
                {product.description}
              </p>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault()
                  if (product.name === 'TinyTalkers') onLaunch('TinyTalkers')
                  if (product.name === 'Time Keeping App') onLaunch('Timekeeping')
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: product.buttonColor,
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                  cursor: 'pointer',
                  border: 'none',
                  textAlign: 'center',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                {product.buttonLabel}
              </a>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}

// ── Contact page ─────────────────────────────────────────────────────────────

const CONTACT_ITEMS = [
  {
    label: 'Phone',
    value: '0961 284 8264',
    href: 'tel:+639612848264',
    color: '#1E88E5',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Email',
    value: 'oikostechnologies@gmail.com',
    href: 'mailto:oikostechnologies@gmail.com',
    color: '#E53935',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    value: 'OikosTechnologies',
    href: 'https://www.facebook.com/OikosTechnologies/',
    color: '#1877F2',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" fill="currentColor"/>
      </svg>
    ),
  },
]

function ContactPage({ onNav }: { onNav: (page: string) => void }) {
  return (
    <PageShell onNav={onNav}>
      {/* Logo — clickable back to home */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <button
          onClick={() => onNav('Home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <OikosLogo />
        </button>
      </div>

      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#111',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}
        >
          Get in Touch
        </h1>
        <p style={{ fontSize: 16, color: '#555', margin: 0 }}>
          We'd love to hear from you. Reach us through any of the channels below.
        </p>
      </div>

      {/* Contact cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 'auto',
        }}
      >
        {CONTACT_ITEMS.map(item => (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              gap: 16,
              textDecoration: 'none',
              transition: 'transform 0.18s, box-shadow 0.18s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-4px)'
              el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${item.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            {/* Label */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: item.color,
                margin: 0,
              }}
            >
              {item.label}
            </p>

            {/* Value */}
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#222',
                margin: 0,
                lineHeight: 1.4,
                wordBreak: 'break-all',
              }}
            >
              {item.value}
            </p>
          </a>
        ))}
      </div>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button
          onClick={() => onNav('Home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          ← Back to Home
        </button>
      </div>
    </PageShell>
  )
}

// ── About page ────────────────────────────────────────────────────────────────

const ABOUT_HIGHLIGHTS = [
  {
    color: '#1E88E5',
    label: 'Our Mission',
    text: 'To empower businesses and educational institutions through smart, reliable, and forward-thinking digital tools.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    color: '#43A047',
    label: 'What We Do',
    text: 'We develop system software solutions tailored to real-world needs — from educational platforms to business productivity tools.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    color: '#C8A000',
    label: 'Our Values',
    text: 'We believe in building technology that is purposeful, accessible, and built to last — grounded in integrity and innovation.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
      </svg>
    ),
  },
]

function AboutPage({ onNav }: { onNav: (page: string) => void }) {
  return (
    <PageShell onNav={onNav}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <button
          onClick={() => onNav('Home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <OikosLogo />
        </button>
      </div>

      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#111',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 20px',
          }}
        >
          About Oikos Technologies
        </h1>
        <p
          style={{
            fontSize: 16,
            color: '#555',
            margin: '0 auto',
            maxWidth: 600,
            lineHeight: 1.7,
          }}
        >
          Welcome to Oikos Technologies, a dedicated system software development company committed to
          empowering businesses and educational institutions through smart, reliable, and
          forward-thinking digital tools.
        </p>
      </div>

      {/* Highlight cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 'auto',
        }}
      >
        {ABOUT_HIGHLIGHTS.map(item => (
          <div
            key={item.label}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              gap: 16,
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${item.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: item.color,
                margin: 0,
              }}
            >
              {item.label}
            </p>

            <p style={{ fontSize: 15, color: '#555', margin: 0, lineHeight: 1.65 }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button
          onClick={() => onNav('Home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          ← Back to Home
        </button>
      </div>
    </PageShell>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('Home')

  const handleNav = (label: string) => {
    if (['Contact', 'About', 'Home'].includes(label)) setPage(label)
  }

  if (page === 'Timekeeping') {
    return (
      <>
        <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setPage('Home')} style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }}>
            ← Oikos home
          </button>
        </div>
        <TimekeepingApp />
      </>
    )
  }

  if (page === 'TinyTalkers') return <TinyTalkersApp onExit={() => setPage('Home')} />

  if (page === 'Contact') return <ContactPage onNav={handleNav} />
  if (page === 'About') return <AboutPage onNav={handleNav} />
  return <LandingPage onNav={handleNav} onLaunch={setPage} />
}
