import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, Building2, Factory, Award, TrendingUp, MapPin, PieChart as PieIcon, BarChart3, Mail, Phone, ChevronLeft, ChevronRight, BadgeCheck, Landmark, Map as MapIcon, Navigation } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useLoading } from '../../contexts/LoadingContext';
import { nodniService, commonDdlService, vasuliService } from '../../services';
import config from '../../config';
import type { CategoryCard } from '../../interfaces/dashboard/Dashboard.types';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

interface GpMember {
  id: number;
  name: string;
  email: string;
  mobile_no: string;
  designation: string;
  profile_image?: string;
}

interface UserData {
  district?: string;
  taluka?: string;
  gram_panchayat?: string;
  gat_gram_panchayat?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const [locationInfo, setLocationInfo] = useState({
    district: '',
    taluka: '',
    gramPanchayat: '',
    gatGramPanchayat: '',
  });

  // Load location info from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user: UserData = JSON.parse(userStr);
        setLocationInfo({
          district: user.district || '',
          taluka: user.taluka || '',
          gramPanchayat: user.gram_panchayat || '',
          gatGramPanchayat: user.gat_gram_panchayat || '',
        });
      } catch {
        console.error('Error parsing user data');
      }
    }
  }, []);

  // Dynamic category counts (id -> count)
  const [counts, setCounts] = useState<Record<string, number>>({});
  const cnt = (id: string) => counts[id] ?? 0;
  const [members, setMembers] = useState<GpMember[]>([]);
  const [vasuliYearWise, setVasuliYearWise] = useState<{ year: string; total: number; baki: number }[]>([]);
  const [vasuliByTax, setVasuliByTax] = useState<Record<string, number>>({});
  // members carousel
  const [slide, setSlide] = useState(0);
  const [perView, setPerView] = useState(3);
  const maxSlide = Math.max(0, members.length - perView);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // keep slide in range when members/perView change
  useEffect(() => {
    setSlide((s) => Math.min(s, Math.max(0, members.length - perView)));
  }, [members.length, perView]);

  // auto-advance when there are more members than fit
  useEffect(() => {
    if (members.length <= perView) return;
    const id = setInterval(() => {
      setSlide((s) => (s >= Math.max(0, members.length - perView) ? 0 : s + 1));
    }, 3500);
    return () => clearInterval(id);
  }, [members.length, perView]);

  // Page load + fetch dynamic counts + gram panchayat members
  useEffect(() => {
    document.title = 'Dashboard - डॅशबोर्ड';
    const loadPage = async () => {
      showLoader('डॅशबोर्ड लोड होत आहे... (Loading dashboard...)');
      try {
        const [countsRes, membersRes, vasuliRes] = await Promise.all([
          nodniService.getDashboardCounts(),
          commonDdlService.getGramPanchayatMembers(),
          vasuliService.getStats(),
        ]);
        if (countsRes.success && countsRes.data) {
          const d = countsRes.data as Record<string, number>;
          setCounts({
            'chalu-khatedar': Number(d.chalu_khatedar || 0),
            adhikrut: Number(d.adhikrut || 0),
            'indira-awas': Number(d.indira_awas || 0),
            imlakar: Number(d.imlakar || 0),
            'ghar-kar': Number(d.ghar_kar || 0),
            audogyik: Number(d.audogyik || 0),
            manora: Number(d.manora || 0),
          });
        }
        if (membersRes.success) setMembers((membersRes.data as GpMember[]) || []);
        if (vasuliRes.success && vasuliRes.data) {
          const v = vasuliRes.data as { year_wise?: { year: string; total: number; baki: number }[]; by_tax?: Record<string, number> };
          setVasuliYearWise(v.year_wise || []);
          setVasuliByTax(v.by_tax || {});
        }
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        hideLoader();
      }
    };
    loadPage();
  }, []);

  const categories: CategoryCard[] = [
    {
      id: 'chalu-khatedar',
      title: 'Chalu Khatedar',
      titleMr: 'चालू खातेदार',
      count: cnt('chalu-khatedar'),
      icon: <Users className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'bg-blue-400/20',
      textColor: 'text-white',
    },
    {
      id: 'adhikrut',
      title: 'Adhikrut',
      titleMr: 'अधिकृत',
      count: cnt('adhikrut'),
      icon: <Award className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'bg-purple-400/20',
      textColor: 'text-white',
    },
    {
      id: 'indira-awas',
      title: 'Indira Awas',
      titleMr: 'इंदिरा आवास',
      count: cnt('indira-awas'),
      icon: <Home className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'bg-green-400/20',
      textColor: 'text-white',
    },
    {
      id: 'imlakar',
      title: 'Imlakar',
      titleMr: 'इमळाकार',
      count: cnt('imlakar'),
      icon: <Building2 className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconColor: 'bg-orange-400/20',
      textColor: 'text-white',
    },
    {
      id: 'ghar-kar',
      title: 'Ghar Kar',
      titleMr: 'घर कर',
      count: cnt('ghar-kar'),
      icon: <Home className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      iconColor: 'bg-red-400/20',
      textColor: 'text-white',
    },
    {
      id: 'audogyik',
      title: 'Audogyik',
      titleMr: 'औद्योगिक',
      count: cnt('audogyik'),
      icon: <Factory className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      iconColor: 'bg-indigo-400/20',
      textColor: 'text-white',
    },
    {
      id: 'manora',
      title: 'Manora',
      titleMr: 'मनोरा',
      count: cnt('manora'),
      icon: <TrendingUp className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
      iconColor: 'bg-teal-400/20',
      textColor: 'text-white',
    },
  ];

  const handleCardClick = async (categoryId: string) => {
    if (categoryId === 'chalu-khatedar') {
      navigate('/dashboard/chalu-khatedar');
      return;
    }
    if (categoryId === 'adhikrut') {
      navigate('/dashboard/adhikrut');
      return;
    }
    if (categoryId === 'indira-awas') {
      navigate('/dashboard/indira-awas');
      return;
    }
    if (['imlakar', 'ghar-kar', 'audogyik', 'manora'].includes(categoryId)) {
      navigate(`/dashboard/${categoryId}`);
      return;
    }
    navigate(`/dashboard/category/${categoryId}`);
  };

  // per-category accent (icon chip + count colour + top bar)
  const accents: Record<string, { chip: string; num: string; bar: string }> = {
    'chalu-khatedar': { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300', num: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
    adhikrut: { chip: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300', num: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
    'indira-awas': { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', num: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    imlakar: { chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', num: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    'ghar-kar': { chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', num: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
    audogyik: { chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', num: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
    manora: { chip: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300', num: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' },
  };
  const defAccent = { chip: 'bg-gray-100 text-gray-600', num: 'text-gray-700', bar: 'bg-gray-400' };

  // chart colours per category (hex, matches accent)
  const colorMap: Record<string, string> = {
    'chalu-khatedar': '#3b82f6', adhikrut: '#8b5cf6', 'indira-awas': '#10b981',
    imlakar: '#f59e0b', 'ghar-kar': '#f43f5e', audogyik: '#6366f1', manora: '#14b8a6',
  };
  // exclude "चालू खातेदार" (it's the grand total) from the distribution chart
  const chartData = categories
    .filter((c) => c.id !== 'chalu-khatedar')
    .map((c) => ({ id: c.id, name: c.titleMr, value: cnt(c.id), fill: colorMap[c.id] || '#9ca3af' }));
  const hasChartData = chartData.some((d) => d.value > 0);

  // वसुली vs बाकी year-wise (grouped bar)
  const vasuliBarData = vasuliYearWise.map((r) => ({
    name: `${r.year}-${Number(r.year) + 1}`,
    total: r.total,
    baki: r.baki,
  }));
  const hasVasuliYear = vasuliBarData.some((d) => d.total > 0 || d.baki > 0);

  // कर-प्रकार-wise वसुली (pie)
  const taxLabels: { key: string; name: string; fill: string }[] = [
    { key: 'gruhkar', name: 'गृहकर', fill: '#3b82f6' },
    { key: 'viz', name: 'वीज', fill: '#f59e0b' },
    { key: 'aarogya', name: 'आरोग्य', fill: '#10b981' },
    { key: 'safai', name: 'सफाई', fill: '#ef4444' },
    { key: 'samanya', name: 'सा. पाणी', fill: '#06b6d4' },
    { key: 'vishesh', name: 'वि. पाणी', fill: '#8b5cf6' },
    { key: 'etar', name: 'इतर', fill: '#6366f1' },
    { key: 'notice', name: 'नोटीस', fill: '#f43f5e' },
  ];
  const vasuliTaxData = taxLabels
    .map((t) => ({ id: t.key, name: t.name, value: Number(vasuliByTax[t.key] || 0), fill: t.fill }))
    .filter((d) => d.value > 0);
  const hasVasuliTax = vasuliTaxData.length > 0;

  return (
    <div className="p-6">
      {/* Category Cards — compact stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => {
          const a = accents[category.id] || defAccent;
          return (
            <div
              key={category.id}
              onClick={() => handleCardClick(category.id)}
              className={`group flex items-center gap-3 cursor-pointer rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${a.num}`}
              style={{ borderLeftColor: 'currentColor' }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.chip} [&>svg]:h-5 [&>svg]:w-5`}>
                {category.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-2xl font-bold leading-none tabular-nums ${a.num}`}>{category.count}</div>
                <div className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">{category.titleMr}</div>
              </div>
              <span className="text-gray-300 transition-all group-hover:text-primary-500 group-hover:translate-x-0.5">→</span>
            </div>
          );
        })}
      </div>

      {/* Charts — मालमत्ता श्रेणी वितरण */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-primary-600" />
            मालमत्ता श्रेणी वितरण (Category Distribution)
          </h2>
          {hasChartData ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {chartData.map((d) => <Cell key={d.id} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={((v: number, n: string) => [`${v} नोंदी`, n]) as never} />
                </PieChart>
              </ResponsiveContainer>
              {/* legend */}
              <div className="grid grid-cols-1 gap-1.5 w-full sm:w-48 shrink-0">
                {chartData.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">माहिती उपलब्ध नाही</p>
          )}
        </div>

        {/* Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            श्रेणीनुसार नोंदी (Records by Category)
          </h2>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={((v: number) => [`${v} नोंदी`, 'नोंदी']) as never} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((d) => <Cell key={d.id} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16">माहिती उपलब्ध नाही</p>
          )}
        </div>
      </div>

      {/* वसुली charts — render only when data exists */}
      {(hasVasuliYear || hasVasuliTax) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Year-wise वसुली (bar) */}
          {hasVasuliYear && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  वर्षनिहाय वसुली vs बाकी
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#10b981' }} />वसुली</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#f43f5e' }} />बाकी</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vasuliBarData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={((v: number, n: string) => [`₹ ${v}`, n]) as never} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar name="वसुली" dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar name="बाकी" dataKey="baki" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* कर-प्रकार-wise वसुली (pie) */}
          {hasVasuliTax && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-primary-600" />
                कर-प्रकारनिहाय वसुली (Collection by Tax Type)
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={vasuliTaxData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} paddingAngle={2}>
                      {vasuliTaxData.map((d) => <Cell key={d.id} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={((v: number, n: string) => [`₹ ${v}`, n]) as never} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-1.5 w-full sm:w-44 shrink-0">
                  {vasuliTaxData.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: d.fill }} />
                        {d.name}
                      </span>
                      <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gram Panchayat Members */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          ग्रामपंचायत सदस्य / कर्मचारी (Gram Panchayat Members)
        </h2>
        {members.length === 0 ? (
          <p className="text-center text-gray-400 py-8">कोणतेही सदस्य आढळले नाहीत (No members found)</p>
        ) : (
          <div className="relative">
            {/* prev / next (only when there is more than a page) */}
            {members.length > perView && (
              <>
                <button
                  onClick={() => setSlide((s) => (s <= 0 ? maxSlide : s - 1))}
                  className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50"
                  aria-label="मागील"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSlide((s) => (s >= maxSlide ? 0 : s + 1))}
                  className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50"
                  aria-label="पुढील"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${slide * (100 / perView)}%)` }}
              >
                {members.map((m) => {
                  const initials = (m.name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <div key={m.id} className="shrink-0 px-2.5" style={{ width: `${100 / perView}%` }}>
                      <div className="group h-full overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        {/* gradient header band */}
                        <div className="h-20 bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-500" />

                        {/* avatar overlapping the band */}
                        <div className="-mt-12 flex justify-center">
                          <div className="relative">
                            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 shadow-md">
                              {m.profile_image ? (
                                <img
                                  src={`${backendBase}/${m.profile_image}`}
                                  alt={m.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }}
                                />
                              ) : null}
                              <div
                                className="h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-emerald-500 text-2xl font-bold text-white"
                                style={{ display: m.profile_image ? 'none' : 'flex' }}
                              >
                                {initials || '?'}
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                              <BadgeCheck className="h-5 w-5 fill-emerald-500 text-white" />
                            </span>
                          </div>
                        </div>

                        {/* details */}
                        <div className="px-4 pb-5 pt-3 text-center">
                          <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">{m.name || '-'}</h3>
                          <span className="mt-1.5 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {m.designation || '-'}
                          </span>
                          <div className="mt-4 space-y-2 text-left text-sm">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-gray-600 dark:text-gray-300">
                              <Mail className="h-4 w-4 shrink-0 text-primary-500" />
                              <span className="truncate">{m.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-gray-600 dark:text-gray-300">
                              <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                              <span className="truncate">{m.mobile_no || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* dots */}
            {members.length > perView && (
              <div className="mt-4 flex justify-center gap-1.5">
                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === slide ? 'w-5 bg-primary-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                    aria-label={`slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Information and Map */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          Location Information / स्थान माहिती
        </h2>

        {/* Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'District / जिल्हा', value: locationInfo.district, Icon: MapPin, bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
            { label: 'Taluka / तालुका', value: locationInfo.taluka, Icon: MapIcon, bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' },
            { label: 'Gram Panchayat / ग्रामपंचायत', value: locationInfo.gramPanchayat, Icon: Landmark, bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
            { label: 'Gat Gram Panchayat / गट ग्रामपंचायत', value: locationInfo.gatGramPanchayat, Icon: Building2, bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' },
          ].map(({ label, value, Icon, bar, badge }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* accent bar */}
              <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
              <div className="flex items-center gap-3 pl-1">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {label}
                  </div>
                  <div className="truncate text-lg font-bold text-gray-900 dark:text-white">
                    {value || '-'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map Section */}
        {locationInfo.gramPanchayat && (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* map header */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Navigation className="h-4 w-4 text-primary-600" />
                <span className="truncate">
                  {locationInfo.gramPanchayat}, {locationInfo.taluka}, {locationInfo.district}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${locationInfo.gramPanchayat}, ${locationInfo.taluka}, ${locationInfo.district}, Maharashtra, India`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
              >
                Google Maps वर पहा
              </a>
            </div>
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                `${locationInfo.gramPanchayat}, ${locationInfo.taluka}, ${locationInfo.district}, Maharashtra, India`
              )}&zoom=14&maptype=roadmap`}
              width="100%"
              height="420"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${locationInfo.gramPanchayat}`}
              className="block w-full"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
