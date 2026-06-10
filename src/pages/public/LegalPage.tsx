import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Sk, SkLines } from '../../components/common/Skeleton';

interface CmsSection {
  section_key: string;
  heading: string | null;
  body: string | null;
}

interface Props {
  pageKey: string;       // 'terms' | 'privacy' | 'disclaimer'
  fallbackTitle: string;
}

// Generic CMS-driven static page (Terms / Privacy / Disclaimer).
const LegalPage: React.FC<Props> = ({ pageKey, fallbackTitle }) => {
  const [section, setSection] = useState<CmsSection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setSection(null);
    api.get<CmsSection[]>(`/public/page/${pageKey}`)
      .then((res) => {
        const data = (res?.data || []) as CmsSection[];
        const s = Array.isArray(data) ? data.find((x) => x.section_key === 'content') || data[0] : null;
        if (s) setSection(s);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [pageKey]);

  useEffect(() => {
    document.title = `${section?.heading || fallbackTitle}`;
  }, [section, fallbackTitle]);

  const title = section?.heading || fallbackTitle;

  return (
    <div className="min-h-screen py-12 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-primary-600" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 p-6 md:p-10">
          {!loaded ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Sk className="h-5 w-48 mb-3" />
                  <SkLines lines={3} />
                </div>
              ))}
            </div>
          ) : section?.body ? (
            <div
              className="home-about-content text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              मजकूर लवकरच उपलब्ध होईल. (Content coming soon.)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
