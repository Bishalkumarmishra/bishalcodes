import React, { useState, useEffect } from 'react';
import { Mail, Phone, AlertCircle, Facebook, Instagram, Linkedin, Github, ArrowUpRight, Loader2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
// @ts-ignore
import { query, collection, getDocs, orderBy, doc, getDoc, addDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LegalPage as LegalPageType, SocialLink, PathPage } from '../types';
import ReportProblemModal from '../components/ReportProblemModal';

const Footer: React.FC = () => {
  const { navigate } = useNavigation();
  const [legalPages, setLegalPages] = useState<LegalPageType[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    setNewsletterStatus(null);
    try {
      const emailVal = newsletterEmail.trim();
      const emailValLower = emailVal.toLowerCase();
      
      // Basic email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValLower)) {
        setNewsletterStatus({ success: false, message: 'Please enter a valid email address.' });
        return;
      }

      await addDoc(collection(db, 'newsletter'), {
        email: emailValLower,
        timestamp: Date.now()
      });
      
      // Trigger welcome email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'newsletter-welcome',
            data: { email: emailVal }
          })
        });
      } catch (mailErr) {
        console.warn("Welcome email trigger failed:", mailErr);
      }

      setNewsletterStatus({ success: true, message: 'Subscribed successfully!' });
      setNewsletterEmail('');
    } catch (err) {
      console.error("Newsletter subscription failed:", err);
      setNewsletterStatus({ success: false, message: 'Failed to subscribe. Please try again.' });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const renderNewsletterForm = (isMobile: boolean) => {
    return (
      <div style={{ marginTop: isMobile ? '32px' : '32px' }} className={isMobile ? 'col-span-2 md:hidden' : 'hidden md:block'}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3d4a5c', marginBottom: '10px' }}>
          Newsletter
        </p>
        <p style={{ fontSize: '12.5px', color: '#5a6478', lineHeight: '1.5', marginBottom: '14px', maxWidth: isMobile ? '100%' : '240px' }}>
          Subscribe to get notified when new projects, tools, or articles are published.
        </p>
        <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '6px', maxWidth: isMobile ? '360px' : '260px', width: '100%' }}>
          <input
            type="email"
            required
            placeholder="Enter email..."
            value={newsletterEmail}
            onChange={e => setNewsletterEmail(e.target.value)}
            disabled={newsletterSubmitting}
            style={{
              flex: 1,
              background: '#0e1117',
              border: '1px solid #1e2535',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12.5px',
              color: '#c8d0dc',
              outline: 'none',
              minWidth: 0
            }}
          />
          <button
            type="submit"
            disabled={newsletterSubmitting}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
          >
            {newsletterSubmitting ? <Loader2 size={13} className="animate-spin" /> : 'Subscribe'}
          </button>
        </form>
        {newsletterStatus && (
          <p style={{ fontSize: '11.5px', marginTop: '8px', color: newsletterStatus.success ? '#4ade80' : '#f87171', fontWeight: 500 }}>
            {newsletterStatus.message}
          </p>
        )}
      </div>
    );
  };

  const defaultSocials: SocialLink[] = [
    { id: 'facebook',  name: 'Facebook',  url: 'https://www.facebook.com/share/1AhoqK2XMo/', enabled: true },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/bishalmishra9827?igsh=NHo2d2I5YTBmdms3', enabled: true },
    { id: 'tiktok',    name: 'TikTok',    url: 'https://www.tiktok.com/@bishal_mishra1?_r=1&_t=ZS-92jwosZwCW0', enabled: true },
    { id: 'linkedin',  name: 'LinkedIn',  url: 'https://www.linkedin.com/in/beesalmishra/', enabled: true },
    { id: 'github',    name: 'GitHub',    url: 'https://github.com/Bishalkumarmishra/bishalcodes', enabled: true },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qLegal = query(collection(db, 'legalPages'), orderBy('createdAt', 'asc'));
        const legalSnap = await getDocs(qLegal);
        setLegalPages(legalSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as LegalPageType)));
        const socialSnap = await getDoc(doc(db, 'settings', 'socials'));
        if (socialSnap.exists()) {
          setSocials((socialSnap.data() as any).links || []);
        } else {
          setSocials(defaultSocials);
        }
      } catch {
        setSocials(defaultSocials);
      }
    };
    fetchData();
  }, []);

  const quickLinks: { label: string; id: PathPage }[] = [
    { label: 'Products',    id: 'services' },
    { label: 'Docs',        id: 'docs' },
    { label: 'Say hello',   id: 'contact' },
  ];

  const getSocialIcon = (name: string) => {
    const s = { size: 15 };
    switch (name) {
      case 'Facebook':  return <Facebook {...s} />;
      case 'Instagram': return <Instagram {...s} />;
      case 'TikTok':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        );
      case 'LinkedIn': return <Linkedin {...s} />;
      case 'GitHub':   return <Github {...s} />;
      default:         return null;
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" style={{ background: '#080a0e', borderTop: '1px solid #1a1f2e', color: '#8892a4' }}>

      {/* ── Top accent line ── */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #a855f7 55%, #06b6d4 80%, transparent 100%)', opacity: 0.5 }} />

      <div className="footer-inner">

        {/* ════ ROW 1 — Brand + Nav + Contact ════ */}
        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr] gap-10 md:gap-16 items-start">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => navigate('home')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: '20px', display: 'block' }}
            >
              <img
                src="/logo.png"
                alt="BishalCodes"
                style={{ height: '34px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
              />
            </button>

            <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#5a6478', maxWidth: '300px', marginBottom: '28px', fontWeight: 400 }}>
              I build fast, clean web apps that actually work — and look good doing it. Based in Nepal 🇳🇵, working with clients worldwide.
            </p>

            {/* Socials */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {socials.filter(s => s.enabled).map(s => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '8px',
                    background: '#0e1117',
                    border: '1px solid #1e2535',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#5a6478',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#161c2a';
                    (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
                    (e.currentTarget as HTMLElement).style.borderColor = '#2d3748';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '#0e1117';
                    (e.currentTarget as HTMLElement).style.color = '#5a6478';
                    (e.currentTarget as HTMLElement).style.borderColor = '#1e2535';
                  }}
                >
                  {getSocialIcon(s.name)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1">
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3d4a5c', marginBottom: '20px' }}>
              Pages
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickLinks.map(link => (
                <li key={link.id}>
                  <button
                    onClick={() => navigate(link.id)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontSize: '14px', color: '#5a6478', fontWeight: 400,
                      display: 'flex', alignItems: 'center', gap: '5px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c8d0dc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5a6478')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop-only Newsletter */}
            {renderNewsletterForm(false)}
          </div>

          {/* Contact + Legal */}
          <div className="col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3d4a5c', marginBottom: '20px' }}>
                Get in touch
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <a
                  href="mailto:developer@bishalcodes.com"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#5a6478', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c8d0dc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5a6478')}
                >
                  <Mail size={13} style={{ flexShrink: 0, color: '#3d4a5c' }} />
                  developer@bishalcodes.com
                </a>
                <a
                  href="tel:+9779828701575"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#5a6478', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c8d0dc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5a6478')}
                >
                  <Phone size={13} style={{ flexShrink: 0, color: '#3d4a5c' }} />
                  +977 9828701575
                </a>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3d4a5c', marginBottom: '16px' }}>
                Legal
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {legalPages.map(page => (
                  <a
                    key={page.id}
                    href={`/legal/${page.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('legal-page', page.slug);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13.5px', color: '#5a6478', textAlign: 'left', transition: 'color 0.15s', textDecoration: 'none', display: 'inline-block' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c8d0dc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5a6478')}
                  >
                    {page.title}
                  </a>
                ))}
                {!legalPages.some(p => p.slug === 'refund-policy') && (
                  <a
                    href="/legal/refund-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('legal-page', 'refund-policy');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13.5px', color: '#5a6478', textAlign: 'left', transition: 'color 0.15s', textDecoration: 'none', display: 'inline-block' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c8d0dc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5a6478')}
                  >
                    Refund Policy
                  </a>
                )}
                <button
                  onClick={() => setIsReportOpen(true)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', color: '#e05252', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#e05252')}
                >
                  <AlertCircle size={12} />
                  Report a problem
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile-only Newsletter */}
          {renderNewsletterForm(true)}
        </div>

        {/* ════ BOTTOM BAR ════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left" style={{ padding: '22px 0 28px' }}>

          <p style={{ fontSize: '12.5px', color: '#2e3a4e', fontWeight: 500 }}>
            © {year} Bishal Codes — All rights reserved.
          </p>

          <span style={{ fontSize: '12px', color: '#2e3a4e' }}>
            Built with ♥ in Nepal
          </span>

        </div>
      </div>

      <ReportProblemModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </footer>
  );
};

export default Footer;
