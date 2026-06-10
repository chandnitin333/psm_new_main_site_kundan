import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { CONTACT_PERSONS } from '../../constants';
import type { ContactFormData } from '../../interfaces';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { Sk, SkLines } from '../../components/common/Skeleton';
import RichTextEditor from '../../components/common/RichTextEditor';

// ---- CMS types ----
interface CmsItem {
  id: number;
  image: string | null;
  heading: string | null;
  sub_heading: string | null;
  body: string | null;
  link: string | null;
  seq: number;
}
interface CmsSection {
  id: number;
  section_key: string;
  type: string;
  heading: string | null;
  sub_heading: string | null;
  body: string | null;
  image: string | null;
  seq: number;
  items: CmsItem[];
}

// icons cycled across the contact-info items (not stored in CMS)
const INFO_ICONS = [MapPin, Phone, Mail];

const Contact = () => {
  const { toast, ToastContainer } = useToast();
  const [sections, setSections] = useState<CmsSection[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = 'Contact Us - संपर्क करा';
    api.get<CmsSection[]>('/public/page/contact')
      .then((res) => {
        const data = (res?.data || []) as CmsSection[];
        if (Array.isArray(data) && data.length) setSections(data);
      })
      .catch(() => { /* fall back to static defaults */ })
      .finally(() => setLoaded(true));
  }, []);

  const sec = (key: string) => sections?.find((s) => s.section_key === key);

  // header
  const headerSec = sec('header');
  const pageTitle = headerSec?.heading || 'Contact Us';
  const pageSub = headerSec?.sub_heading || "We'd love to hear from you. Get in touch with us.";

  // contact info
  const infoSec = sec('contact_info');
  const infoItems = infoSec?.items?.length
    ? infoSec.items.map((it) => ({ label: it.heading || '', details: it.body || '' }))
    : [
        { label: 'Office Address', details: '123 Village Road, District Office\nMaharashtra, India - 411001' },
        { label: 'Phone', details: '+91 98765 43210\n+91 98765 43211' },
        { label: 'Email', details: 'info@grampanchayat.gov.in\nsupport@grampanchayat.gov.in' },
      ];
  const infoTitle = infoSec?.heading || 'Contact Information';

  // key personnel
  const personnelSec = sec('personnel');
  const personnel = personnelSec?.items?.length
    ? personnelSec.items.map((it) => ({
        id: String(it.id), name: it.heading || '', profession: it.sub_heading || '',
        contact: it.body || '', email: it.link || '',
      }))
    : CONTACT_PERSONS;
  const personnelTitle = personnelSec?.heading || 'Key Personnel';
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // require a non-empty message (strip HTML tags to check)
    const plainMsg = formData.message.replace(/<[^>]+>/g, '').trim();
    if (!plainMsg) {
      toast.error('Please type your message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/public/contact-message', formData);
      if (res?.success) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(res?.message || 'Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 bg-white dark:bg-gray-900">
      <ToastContainer />
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          {loaded ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {pageTitle}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {pageSub}
              </p>
            </>
          ) : (
            <>
              <Sk className="h-10 w-72 mb-4" />
              <Sk className="h-5 w-96 max-w-full" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <RichTextEditor
                  value={formData.message}
                  onChange={(html) => setFormData((prev) => ({ ...prev, message: html }))}
                  placeholder="Type your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          {!loaded ? (
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, c) => (
                <div key={c} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <Sk className="h-7 w-48 mb-6" />
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Sk className="h-6 w-6 rounded-full flex-shrink-0" />
                        <div className="flex-1"><SkLines lines={2} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {infoTitle}
              </h2>
              <div className="space-y-4">
                {infoItems.map((info, index) => {
                  const Icon = INFO_ICONS[index % INFO_ICONS.length];
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <Icon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {info.label}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {info.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Personnel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {personnelTitle}
              </h2>
              <div className="space-y-6">
                {personnel.map((person) => (
                  <div key={person.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {person.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {person.profession}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-primary-600" />
                        <span className="text-gray-700 dark:text-gray-300">{person.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-primary-600" />
                        <a
                          href={`mailto:${person.email}`}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {person.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
