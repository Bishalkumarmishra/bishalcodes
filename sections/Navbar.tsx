import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Home, FileText, Settings, User, Briefcase, Mail, Facebook, Instagram, Linkedin, Github, BookOpen, Sun, Moon, Calendar, Terminal, Edit2, Code } from 'lucide-react';
import { auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigation } from '../context/NavigationContext';
import { PathPage } from '../types';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user] = useAuthState(auth);
  const { navigate, currentPage } = useNavigation();

  // Live visual editor state in navbar
  const [liveEditActive, setLiveEditActive] = useState(false);

  // Add light/dark theme toggle logic
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const updateMetaThemeColors = (currentTheme: 'light' | 'dark') => {
    const color = currentTheme === 'dark' ? '#000000' : '#FFFFFF';
    // Update theme-color tags
    const metaTags = document.querySelectorAll('meta[name="theme-color"], meta[name="msapplication-navbutton-color"]');
    metaTags.forEach(tag => tag.setAttribute('content', color));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    const root = document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    updateMetaThemeColors(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    const root = document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    updateMetaThemeColors(nextTheme);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLiveEditActive(localStorage.getItem('liveEditMode') === 'true');
    }
    const handleToggle = () => {
      setLiveEditActive(localStorage.getItem('liveEditMode') === 'true');
    };
    window.addEventListener('liveEditToggle', handleToggle);
    return () => window.removeEventListener('liveEditToggle', handleToggle);
  }, []);

  const toggleLiveEdit = () => {
    const newVal = !liveEditActive;
    setLiveEditActive(newVal);
    localStorage.setItem('liveEditMode', newVal ? 'true' : 'false');
    window.dispatchEvent(new Event('liveEditToggle'));
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { name: string; id: PathPage; icon: React.ReactNode }[] = [
    { name: 'Home', id: 'home', icon: <Home size={16} /> },
    { name: 'Creator', id: 'about', icon: <User size={16} /> },
    { name: 'Showcase', id: 'projects', icon: <Briefcase size={16} /> },
    { name: 'Blogs', id: 'blog', icon: <FileText size={16} /> },
    { name: 'Docs', id: 'docs', icon: <BookOpen size={16} /> },
    { name: 'APIs', id: 'developers', icon: <Terminal size={16} /> },
    { name: 'Contact', id: 'contact', icon: <Mail size={16} /> },
  ];

  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const servicesDropdownTimer = React.useRef<any>(null);

  const openServicesDropdown = () => {
    if (servicesDropdownTimer.current) clearTimeout(servicesDropdownTimer.current);
    setServicesDropdownOpen(true);
  };
  const closeServicesDropdown = () => {
    servicesDropdownTimer.current = setTimeout(() => setServicesDropdownOpen(false), 150);
  };

  const socialLinks = [
    { icon: <Facebook size={18} />, url: 'https://www.facebook.com/share/1AhoqK2XMo/' },
    { icon: <Instagram size={18} />, url: 'https://www.instagram.com/bishalmishra9827?igsh=NHo2d2I5YTBmdms3' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>, url: 'https://www.tiktok.com/@bishal_mishra1' },
    { icon: <Linkedin size={18} />, url: 'https://www.linkedin.com/in/beesalmishra/' },
    { icon: <Github size={18} />, url: 'https://github.com/Bishalkumarmishra/bishalcodes' },
  ];

  const allowedAdmins = [
    'bishalmishra9000@gmail.com',
    'admin@bishalcodes.com',
    'developer@bishalcodes.com'
  ];
  const isAdmin = user && user.email && allowedAdmins.includes(user.email);

  const handleLinkClick = (id: PathPage) => {
    if (id === 'admin') {
      window.open('/admin', '_blank');
    } else {
      navigate(id);
    }
    setIsOpen(false);
    setServicesDropdownOpen(false);
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('home');
    setIsOpen(false);
  };

  const navBaseClass = "site-navbar shadow-sm";

  const textLinkClass = (isActive: boolean) => 
    `nav-link text-sm font-medium transition-colors cursor-pointer ${
      isActive ? 'nav-link-active font-semibold' : 'nav-link-inactive'
    }`;

  return (
    <>
      <nav className={navBaseClass}>
        <div className="w-full flex justify-between items-center px-4 md:px-8">
          {/* Brand Logo */}
          <button 
            onClick={() => handleLinkClick('home')} 
            className="flex items-center group relative z-[210] outline-none"
          >
            <img 
              src="/logo.png" 
              alt="BishalCodes Logo" 
              className="brand-logo-img w-28 sm:w-44 h-auto shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </button>

          <ul className="list-none hidden lg:flex flex-row items-center gap-8">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              const path = link.id === 'home' ? '/' : (link.id === 'services' ? '/tools' : `/${link.id}`);

              // Insert Services dropdown before Blogs
              if (link.id === 'blog') {
                const isServicesActive = currentPage === 'services' || currentPage === 'widgets';
                return (
                  <React.Fragment key="services-dropdown-and-blog">
                    {/* Services Dropdown */}
                    <li
                      className="relative"
                      onMouseEnter={openServicesDropdown}
                      onMouseLeave={closeServicesDropdown}
                    >
                      <button
                        className={`${textLinkClass(isServicesActive)} flex items-center gap-1`}
                        onClick={() => handleLinkClick('services')}
                      >
                        <span>Products</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {servicesDropdownOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <button
                            onClick={() => handleLinkClick('services')}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                            Developer Tools
                          </button>
                          <button
                            onClick={() => handleLinkClick('widgets')}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <Code size={14} className="text-emerald-600 dark:text-emerald-400" />
                            Embed Widgets
                          </button>
                        </div>
                      )}
                    </li>

                    {/* Blog link */}
                    <li key={link.id}>
                      <a
                        href={path}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(link.id);
                        }}
                        className={textLinkClass(isActive)}
                      >
                        <span>{link.name}</span>
                      </a>
                    </li>
                  </React.Fragment>
                );
              }

              return (
                <li key={link.id}>
                  <a
                    href={path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(link.id);
                    }}
                    className={textLinkClass(isActive)}
                  >
                    <span>{link.name}</span>
                  </a>
                </li>
              );
            })}
            
            {user ? (
              <li className="flex items-center gap-5 pl-5 border-l border-slate-800">
                {isAdmin ? (
                  <button 
                    onClick={() => handleLinkClick('admin')} 
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      currentPage === 'admin' ? 'text-[var(--nav-text-active)]' : 'text-[var(--nav-text)] hover:text-[var(--nav-text-hover)]'
                    }`}
                  >
                    <Settings size={14} /> Admin
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkClick('user-dashboard')}
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      currentPage === 'user-dashboard' ? 'text-[var(--nav-text-active)]' : 'text-[var(--nav-text)] hover:text-[var(--nav-text-hover)]'
                    }`}
                  >
                    <User size={14} /> Dashboard
                  </button>
                )}
                <button 
                  onClick={handleLogout} 
                  className="text-[var(--nav-text)] hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </li>
            ) : (
               <li>
                  <button 
                    onClick={() => handleLinkClick('login')} 
                    className="bg-slate-950 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm animate-none border border-transparent dark:border-slate-800"
                  >
                   Client Portal
                 </button>
               </li>
            )}
          </ul>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5 relative z-[210]">
            {/* Live Visual Edit toggle in navbar */}
            {(isAdmin || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) && (
              <button
                onClick={toggleLiveEdit}
                title={liveEditActive ? 'Exit Live Edit' : 'Live Visual Edit'}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                  liveEditActive 
                    ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm' 
                    : 'bg-slate-900 border-slate-700 text-white dark:bg-white dark:border-slate-350 dark:text-black'
                }`}
              >
                <Edit2 size={13} className={liveEditActive ? 'animate-pulse' : ''} />
              </button>
            )}

            {/* Theme Toggle Pill */}
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-1 bg-[var(--burger-bg)] border border-[var(--nav-border)] rounded-full p-0.5 transition-all active:scale-95 cursor-pointer"
              title="Toggle theme"
            >
              <div className={`p-1 rounded-full transition-all ${theme === 'light' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>
                <Sun size={12} />
              </div>
              <div className={`p-1 rounded-full transition-all ${theme === 'dark' ? 'bg-[#e52521] text-white shadow-sm' : 'text-slate-500'}`}>
                <Moon size={12} />
              </div>
            </button>

            {/* Facebook Link */}
            <a 
              href="https://www.facebook.com/share/1AhoqK2XMo/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              aria-label="Facebook"
            >
              <Facebook size={14} />
            </a>

            {/* WhatsApp Link */}
            <a 
              href="https://wa.me/9779827801575" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              aria-label="WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.485 10.009-10.004.002-2.673-1.026-5.185-2.895-7.057-1.87-1.872-4.38-2.903-7.056-2.904-5.523 0-10.015 4.486-10.018 10.008-.001 1.702.449 3.361 1.309 4.815l-.997 3.637 3.737-.981zm11.368-6.41c-.263-.13-1.55-.762-1.789-.85-.238-.087-.412-.13-.587.13-.174.26-.675.85-.826 1.022-.15.174-.301.196-.564.065-.263-.13-1.112-.41-2.119-1.312-.783-.7-1.312-1.562-1.466-1.824-.154-.263-.016-.404.117-.534.12-.117.264-.307.396-.462.131-.154.174-.262.263-.437.089-.174.045-.328-.022-.459-.067-.13-.587-1.412-.804-1.936-.211-.508-.444-.44-.607-.44-.156-.002-.336-.002-.516-.002-.18 0-.472.067-.719.336-.247.27-1.012.99-1.012 2.414 0 1.424 1.034 2.799 1.178 2.99.144.192 2.037 3.111 4.935 4.364.69.298 1.228.476 1.648.609.693.22 1.324.19 1.823.115.556-.083 1.55-.632 1.769-1.246.22-.613.22-1.139.154-1.246-.067-.108-.247-.174-.51-.304z"/></svg>
            </a>

            {/* Mobile Burger Toggle */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="burger-toggle p-1 rounded-lg border border-[var(--nav-border)] transition-all active:scale-95 cursor-pointer"
              >
                {isOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div 
        className={`fixed inset-0 nav-overlay z-[90] lg:hidden transition-all duration-300 flex flex-col p-6 pt-20 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-[-10px] pointer-events-none"
        }`}
      >
        <ul className="list-none flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            const path = link.id === 'home' ? '/' : (link.id === 'services' ? '/tools' : `/${link.id}`);

            // Insert Services section before Blogs in mobile too
            if (link.id === 'blog') {
              return (
                <React.Fragment key="mobile-services-and-blog">
                  {/* Services with sub-items */}
                  <li>
                    <button
                      onClick={() => handleLinkClick('services')}
                      className={`flex items-center gap-2.5 py-1.5 text-[15px] font-medium transition-colors cursor-pointer ${
                        currentPage === 'services' ? "text-[var(--nav-text-active)]" : "text-[var(--nav-text)] active:text-[var(--nav-text-hover)]"
                      }`}
                    >
                      <span className="opacity-75"><Calendar size={15} /></span>
                      Developer Tools
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLinkClick('widgets')}
                      className={`flex items-center gap-2.5 py-1.5 text-[15px] font-medium transition-colors cursor-pointer ${
                        currentPage === 'widgets' ? "text-[var(--nav-text-active)]" : "text-[var(--nav-text)] active:text-[var(--nav-text-hover)]"
                      }`}
                    >
                      <span className="opacity-75"><Code size={15} /></span>
                      Embed Widgets
                    </button>
                  </li>
                  {/* Blog */}
                  <li>
                    <a
                      href={path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.id);
                      }}
                      className={`flex items-center gap-2.5 py-1.5 text-[15px] font-medium transition-colors cursor-pointer ${
                        isActive ? "text-[var(--nav-text-active)]" : "text-[var(--nav-text)] active:text-[var(--nav-text-hover)]"
                      }`}
                    >
                      <span className="opacity-75">{link.icon}</span>
                      {link.name}
                    </a>
                  </li>
                </React.Fragment>
              );
            }

            return (
              <li key={link.id}>
                <a 
                  href={path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(link.id);
                  }}
                  className={`flex items-center gap-2.5 py-1.5 text-[15px] font-medium transition-colors cursor-pointer ${
                    isActive ? "text-[var(--nav-text-active)]" : "text-[var(--nav-text)] active:text-[var(--nav-text-hover)]"
                  }`} 
                >
                  <span className="opacity-75">{link.icon}</span>
                  {link.name}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex flex-col gap-6">
          <div className="border-t border-[var(--connect-border)] pt-6">
            <p className="opacity-60 font-semibold text-[10px] uppercase tracking-wider mb-4">Connect</p>
            <div className="flex gap-2">
              {socialLinks.map((social, i) => (
                <a 
                  key={i} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-[var(--social-bg)] rounded-lg flex items-center justify-center text-[var(--social-color)] border border-[var(--connect-border)] active:scale-95 transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="pb-4">
            {user ? (
              <div className="space-y-3">
                {isAdmin ? (
                  <button 
                    onClick={() => handleLinkClick('admin')} 
                    className="flex items-center justify-between w-full bg-[var(--social-bg)] border border-[var(--connect-border)] p-4 rounded-lg font-medium text-[var(--nav-text)] text-sm"
                  >
                    <span>Admin Terminal</span>
                    <Settings size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkClick('user-dashboard')}
                    className="flex items-center justify-between w-full bg-[var(--social-bg)] border border-[var(--connect-border)] p-4 rounded-lg font-medium text-[var(--nav-text)] text-sm"
                  >
                    <span>My Dashboard</span>
                    <User size={16} />
                  </button>
                )}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center justify-between w-full bg-rose-950/20 border border-rose-900/50 p-4 rounded-lg font-medium text-rose-400 text-sm hover:bg-rose-900/10 transition-colors"
                >
                  <span>Sign Out</span>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleLinkClick('login')} 
                className="w-full bg-[#e52521] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#d01f1c] transition-colors shadow-sm animate-none"
              >
                Client Access Portal
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
