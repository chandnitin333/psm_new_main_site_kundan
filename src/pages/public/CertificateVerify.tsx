import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { certificateService, type CertificateVerifyResult } from '../../services/certificateService';

/**
 * PUBLIC certificate authenticity page (no login).
 * Opened when someone scans the QR printed on a certificate — it confirms the
 * certificate was genuinely issued by the gram panchayat (anti-forgery).
 * Shows only safe confirmation fields, never the full personal data.
 */
const CertificateVerify = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CertificateVerifyResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await certificateService.verify(token || '');
        if (!active) return;
        if (res.success && res.data) setResult(res.data);
        else setError(true);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const valid = !!result?.valid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header band */}
        <div className="bg-primary-700 px-6 py-5 text-center text-white">
          <p className="text-sm opacity-90">ग्रामपंचायत प्रमाणपत्र पडताळणी</p>
          <p className="text-xs opacity-75">Certificate Verification</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-10 text-center text-gray-500">तपासत आहे... (Verifying...)</div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
              <p className="font-semibold text-red-600">पडताळणी करता आली नाही</p>
              <p className="mt-1 text-sm text-gray-500">कृपया पुन्हा प्रयत्न करा.</p>
            </div>
          ) : valid ? (
            <>
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
                <p className="text-lg font-bold text-green-700">वैध प्रमाणपत्र</p>
                <p className="text-sm text-gray-500">हे प्रमाणपत्र ग्रामपंचायतीने अधिकृतरीत्या दिलेले आहे.</p>
              </div>
              <dl className="space-y-2 text-sm">
                <Row k="प्रमाणपत्र" v={result?.cert_name} />
                <Row k="अर्जदार / लाभार्थी" v={result?.applicant_name} />
                <Row k="जावक क्र." v={result?.outward_no} />
                <Row k="दिनांक" v={result?.issued_date} />
                <Row k="ग्रामपंचायत" v={result?.gram_panchayat} />
                <Row k="तालुका" v={result?.taluka} />
                <Row k="जिल्हा" v={result?.district} />
              </dl>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">❌</div>
              <p className="text-lg font-bold text-red-600">प्रमाणपत्र आढळले नाही</p>
              <p className="mt-1 text-sm text-gray-500">
                हा QR / कोड वैध नाही. हे प्रमाणपत्र ग्रामपंचायत नोंदीत आढळले नाही.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 text-center text-xs text-gray-400">
          PSM — ग्रामपंचायत मालमत्ता व कर व्यवस्थापन प्रणाली
        </div>
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v?: string }) => (
  <div className="flex justify-between gap-3 border-b border-gray-100 pb-1.5">
    <dt className="shrink-0 text-gray-500">{k}</dt>
    <dd className="text-right font-medium text-gray-900">{v || '—'}</dd>
  </div>
);

export default CertificateVerify;
