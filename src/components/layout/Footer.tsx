import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { getCmsIcon } from '../../utils/cmsIcons';

// ---- CMS types ----
interface CmsItem {
  id: number;
  icon: string | null;
  heading: string | null;
  body: string | null;
  link: string | null;
  seq: number;
}
interface CmsSection {
  section_key: string;
  heading: string | null;
  body: string | null;
  items: CmsItem[];
}

const INFO_ICONS = [MapPin, Phone, Mail];          // contact-info fallback cycle
const SOCIAL_FALLBACK_ICONS = [Facebook, Twitter, Instagram, Linkedin];

// internal route → <Link>, otherwise plain <a>
const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const cls = 'text-sm hover:text-primary-500 transition-colors';
  return to.startsWith('/')
    ? <Link to={to} className={cls}>{children}</Link>
    : <a href={to} className={cls}>{children}</a>;
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [footer, setFooter] = useState<CmsSection[] | null>(null);
  const [contact, setContact] = useState<CmsSection[] | null>(null);

  useEffect(() => {
    api.get<CmsSection[]>('/public/page/footer')
      .then((res) => { const d = (res?.data || []) as CmsSection[]; if (Array.isArray(d) && d.length) setFooter(d); })
      .catch(() => {});
    api.get<CmsSection[]>('/public/page/contact')
      .then((res) => { const d = (res?.data || []) as CmsSection[]; if (Array.isArray(d) && d.length) setContact(d); })
      .catch(() => {});
  }, []);

  const fSec = (key: string) => footer?.find((s) => s.section_key === key);

  // About
  const aboutSec = fSec('about');
  const aboutTitle = aboutSec?.heading || 'About Us';
  const aboutBody = aboutSec?.body || '<p>Empowering rural communities through digital transformation and sustainable development initiatives.</p>';

  // Social
  const socialSec = fSec('social');
  const social = socialSec?.items?.length
    ? socialSec.items.map((it) => ({ id: it.id, icon: it.icon, link: it.link || '#' }))
    : [
        { id: -1, icon: 'Facebook', link: '#' },
        { id: -2, icon: 'Twitter', link: '#' },
        { id: -3, icon: 'Instagram', link: '#' },
        { id: -4, icon: 'Linkedin', link: '#' },
      ];

  // Quick / Important links
  const quickSec = fSec('quick_links');
  const quick = quickSec?.items?.length
    ? quickSec.items.map((it) => ({ id: it.id, label: it.heading || '', link: it.link || '#' }))
    : [
        { id: -1, label: 'Home', link: '/' },
        { id: -2, label: 'About Us', link: '/about' },
        { id: -3, label: 'Contact Us', link: '/contact' },
        { id: -4, label: 'Login', link: '/login' },
      ];
  const quickTitle = quickSec?.heading || 'Quick Links';

  const impSec = fSec('important_links');
  const important = impSec?.items?.length
    ? impSec.items.map((it) => ({ id: it.id, label: it.heading || '', link: it.link || '#' }))
    : [
        { id: -1, label: 'Government Portal', link: '#' },
        { id: -2, label: 'Schemes & Programs', link: '#' },
        { id: -3, label: 'RTI Information', link: '#' },
        { id: -4, label: 'Privacy Policy', link: '#' },
      ];
  const impTitle = impSec?.heading || 'Important Links';

  // Contact info — reused from the Contact page CMS
  const infoSec = contact?.find((s) => s.section_key === 'contact_info');
  const info = infoSec?.items?.length
    ? infoSec.items.map((it) => ({ id: it.id, details: it.body || '' }))
    : [
        { id: -1, details: '123 Village Road, District Office,\nMaharashtra, India' },
        { id: -2, details: '+91 98765 43210' },
        { id: -3, details: 'info@grampanchayat.gov.in' },
      ];
  const infoTitle = infoSec?.heading || 'Contact Info';

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{aboutTitle}</h3>
            <div
              className="text-sm leading-relaxed mb-4 [&_p]:mb-2 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: aboutBody }}
            />
            <div className="flex gap-3">
              {social.map((s, index) => {
                const Icon = getCmsIcon(s.icon) || SOCIAL_FALLBACK_ICONS[index % SOCIAL_FALLBACK_ICONS.length];
                return (
                  <a
                    key={s.id}
                    href={s.link}
                    target={s.link.startsWith('http') ? '_blank' : undefined}
                    rel={s.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-8 h-8 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{quickTitle}</h3>
            <ul className="space-y-2">
              {quick.map((l) => (
                <li key={l.id}><FooterLink to={l.link}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{impTitle}</h3>
            <ul className="space-y-2">
              {important.map((l) => (
                <li key={l.id}><FooterLink to={l.link}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{infoTitle}</h3>
            <ul className="space-y-3">
              {info.map((c, index) => {
                const Icon = INFO_ICONS[index % INFO_ICONS.length];
                return (
                  <li key={c.id} className="flex items-start gap-2">
                    <Icon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm whitespace-pre-line">{c.details}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:pr-44 lg:pr-48">
            <p className="text-sm text-center md:text-left">
              &copy; {currentYear} Gram Panchayat Portal. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link to="/terms" className="hover:text-primary-500 transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-primary-500 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/disclaimer" className="hover:text-primary-500 transition-colors">
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
