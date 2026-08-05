import { useEffect, useState } from 'react';
import {
  Target, Rocket, History, Users, Settings, TrendingUp, Heart, Award,
  BookOpen, Lightbulb, ArrowRight, Sparkles, Quote,
} from 'lucide-react';
import { api } from '../../services/api';
import { Sk, SkLines } from '../../components/common/Skeleton';
import { getCmsIcon } from '../../utils/cmsIcons';

// ---- CMS types ----
interface CmsItem {
  id: number;
  image: string | null;
  icon: string | null;
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

// Fixed presentation assets (not stored in CMS) — cycled across items.
const STAT_ICONS = [Users, Award, TrendingUp, Heart];
const VALUE_ICONS = [Target, Heart, Lightbulb, BookOpen];
const VALUE_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
];
const SERVICE_ICONS = [Settings, BookOpen, Users, Heart];

// ---- Static fallbacks (used until CMS loads / if a section is empty) ----
const FB_HERO = {
  heading: 'About Our Organization',
  sub: 'Empowering communities, transforming lives through technology and governance',
};
const FB_STATS = [
  { value: '500+', label: 'Communities Served' },
  { value: '10+', label: 'Years of Experience' },
  { value: '1000+', label: 'Success Stories' },
  { value: '50+', label: 'Team Members' },
];
const FB_VALUES = [
  { title: 'Excellence', description: 'We strive for the highest standards in everything we do', icon: null as string | null },
  { title: 'Community First', description: 'Communities are at the heart of all our initiatives', icon: null as string | null },
  { title: 'Innovation', description: 'Embracing technology to solve traditional challenges', icon: null as string | null },
  { title: 'Transparency', description: 'Open and accountable in all our operations', icon: null as string | null },
];
const FB_JOURNEY = [
  { title: 'A Small Initiative', stage: 'सुरुवात', text: 'What started as a small initiative to digitize records in a handful of gram panchayats grew from a vision to transform rural governance through digital innovation.' },
  { title: 'Understanding the Ground', stage: 'वाटचाल', text: 'Through extensive field research and consultations with stakeholders, we developed a deep appreciation for the complexities of rural governance.' },
  { title: 'A Trusted Partner', stage: 'आज', text: 'Today we stand as a trusted partner for rural communities, government agencies, and development organizations working towards rural transformation.' },
];
const FB_SERVICES = [
  { title: 'Digital Platform', description: 'Integrated solutions for record management, citizen services, and financial management', icon: null as string | null },
  { title: 'Training Programs', description: 'Comprehensive capacity building from basic literacy to advanced analytics', icon: null as string | null },
  { title: 'Consulting Services', description: 'Expert guidance for development planning and scheme implementation', icon: null as string | null },
  { title: 'Technical Support', description: 'Dedicated helpdesk and field support teams for continuous assistance', icon: null as string | null },
];

const About = () => {
  const [sections, setSections] = useState<CmsSection[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = 'About Us - आमच्याबद्दल';
    api.get<CmsSection[]>('/public/page/about')
      .then((res) => {
        const data = (res?.data || []) as CmsSection[];
        if (Array.isArray(data) && data.length) setSections(data);
      })
      .catch(() => { /* fall back to static defaults */ })
      .finally(() => setLoaded(true));
  }, []);

  const sec = (key: string) => sections?.find((s) => s.section_key === key);

  // ---- Hero ----
  const heroSec = sec('hero');
  const heroTitle = heroSec?.heading || FB_HERO.heading;
  const heroSub = heroSec?.sub_heading || FB_HERO.sub;

  // ---- Stats ----
  const statsSec = sec('stats');
  const stats = statsSec?.items?.length
    ? statsSec.items.map((it) => ({ value: it.heading || '', label: it.sub_heading || '' }))
    : FB_STATS;

  // ---- About overview (full details, above Vision & Mission) ----
  const aboutSec = sec('about');

  // ---- Vision / Mission / Impact (text) ----
  const visionSec = sec('vision');
  const missionSec = sec('mission');
  const impactSec = sec('impact');

  // ---- Values ----
  const valuesSec = sec('values');
  const values = valuesSec?.items?.length
    ? valuesSec.items.map((it) => ({ title: it.heading || '', description: it.sub_heading || '', icon: it.icon }))
    : FB_VALUES;
  const valuesTitle = valuesSec?.heading || 'Our Core Values';
  const valuesSub = valuesSec?.sub_heading || 'The principles that guide our work and define our approach to rural development';

  // ---- Journey ----
  const journeySec = sec('journey');
  const journey = journeySec?.items?.length
    ? journeySec.items.map((it) => ({ title: it.heading || '', stage: it.sub_heading || '', text: it.body || '' }))
    : FB_JOURNEY;
  const journeyTitle = journeySec?.heading || 'Our Journey';

  // ---- Services ----
  const servicesSec = sec('services');
  const services = servicesSec?.items?.length
    ? servicesSec.items.map((it) => ({ title: it.heading || '', description: it.sub_heading || '', icon: it.icon }))
    : FB_SERVICES;
  const servicesTitle = servicesSec?.heading || 'Our Services';
  const servicesSub = servicesSec?.sub_heading || 'Comprehensive solutions designed to support every aspect of rural governance and development';

  // ---- CTA ----
  const ctaSec = sec('cta');
  const ctaTitle = ctaSec?.heading || 'Join Us in Our Mission';
  const ctaSub = ctaSec?.sub_heading || 'Together, we can build stronger, more connected communities';

  // skeleton while CMS content loads
  if (!loaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="bg-gradient-to-br from-primary-700 to-primary-800 py-24">
          <div className="container mx-auto px-4 flex flex-col items-center">
            <Sk className="h-10 w-2/3 max-w-xl mb-4 bg-white/20" />
            <Sk className="h-5 w-1/2 max-w-md bg-white/20" />
          </div>
        </div>
        <div className="container mx-auto px-4 -mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Sk key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
              <Sk className="h-7 w-40 mb-4" />
              <SkLines lines={4} />
            </div>
          ))}
        </div>
        <div className="container mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <Sk className="h-12 w-12 rounded-xl mb-4" />
              <Sk className="h-5 w-24 mb-2" />
              <SkLines lines={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute top-0 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.4) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-medium mb-5">
            <Sparkles className="w-4 h-4" /> आमच्याबद्दल
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-2xl text-primary-100 max-w-3xl mx-auto">
            {heroSub}
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-20 fill-white dark:fill-gray-900" preserveAspectRatio="none">
            <path d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ===== Stats ===== */}
      {stats.length > 0 && (
        <section className="relative -mt-8 md:-mt-12 z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => {
                const Icon = STAT_ICONS[index % STAT_ICONS.length];
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/5 p-6 text-center hover:-translate-y-1 transition-transform"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-xl mb-3 shadow-lg shadow-primary-600/30">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== About overview (full details) — above Vision & Mission ===== */}
      {aboutSec?.body && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {aboutSec.heading || 'आमच्याबद्दल'}
              </h2>
            </div>
            <div
              className="home-about-content text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: aboutSec.body }}
            />
          </div>
        </section>
      )}

      {/* ===== Vision & Mission ===== */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {visionSec?.heading || 'Our Vision'}
                </h2>
              </div>
              {visionSec?.body ? (
                <div className="home-about-content text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: visionSec.body }} />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We envision a future where every village and rural community has access to modern technology, efficient governance, and comprehensive development opportunities.
                </p>
              )}
            </div>

            {/* Mission */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-green-600" />
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {missionSec?.heading || 'Our Mission'}
                </h2>
              </div>
              {missionSec?.body ? (
                <div className="home-about-content text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: missionSec.body }} />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Our mission is to revolutionize rural governance through digital transformation and capacity building.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Core Values ===== */}
      {values.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">मूल्ये</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                {valuesTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{valuesSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = getCmsIcon(value.icon) || VALUE_ICONS[index % VALUE_ICONS.length];
                const color = VALUE_COLORS[index % VALUE_COLORS.length];
                return (
                  <div
                    key={index}
                    className="group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all hover:-translate-y-2"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== Our Journey (timeline) ===== */}
      {journey.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white rounded-2xl mb-4 shadow-lg shadow-purple-600/30">
                <History className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {journeyTitle}
              </h2>
            </div>

            <div className="relative pl-8 md:pl-0">
              <div className="absolute left-3 md:left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-400 to-fuchsia-400 md:-translate-x-1/2" />
              <div className="space-y-8">
                {journey.map((step, i) => (
                  <div key={i} className={`relative md:grid md:grid-cols-2 md:gap-8 ${i % 2 ? 'md:text-left' : ''}`}>
                    <span className="absolute -left-[1.4rem] md:left-1/2 top-2 w-4 h-4 rounded-full bg-purple-600 ring-4 ring-purple-200 dark:ring-purple-900 md:-translate-x-1/2 z-10" />
                    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md ring-1 ring-black/5 dark:ring-white/5 ${i % 2 ? 'md:col-start-2' : 'md:col-start-1'}`}>
                      {step.stage && (
                        <span className="inline-block text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-1">
                          {step.stage}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Services ===== */}
      {services.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">सेवा</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                {servicesTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{servicesSub}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, index) => {
                const Icon = getCmsIcon(service.icon) || SERVICE_ICONS[index % SERVICE_ICONS.length];
                return (
                  <div
                    key={index}
                    className="group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-600/30 group-hover:rotate-6 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== Impact ===== */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
            <Quote className="absolute top-6 right-6 w-20 h-20 text-white/10" />
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur rounded-xl mb-5">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">{impactSec?.heading || 'Our Impact'}</h2>
            {impactSec?.body ? (
              <div
                className="text-green-50 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: impactSec.body }}
              />
            ) : (
              <p className="text-green-50 leading-relaxed">
                Over the years, our work has touched the lives of millions of rural citizens, helping hundreds of gram panchayats transition to digital governance.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900 text-white">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {ctaTitle}
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            {ctaSub}
          </p>
          <a
            href="/contact"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5"
          >
            Get In Touch
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
