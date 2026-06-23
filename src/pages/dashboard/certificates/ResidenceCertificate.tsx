import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import CertificateLayout from './CertificateLayout';

/* रहिवासी प्रमाणपत्र — left: fill form, right: live preview.
   Saved to DB (GP-scoped). Uses shared CertificateLayout. */
const ResidenceCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    name: '', relation: 'वडील', parent: '', age: '', gender: 'पुरुष',
    village: '', houseNo: '', fullAddress: '', residentSince: '', years: '',
    aadhaar: '', purpose: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  // re-view / re-print: if ?id= present, load saved certificate and prefill (print only)
  const [params] = useSearchParams();
  const isView = !!params.get('id');
  useEffect(() => {
    const id = params.get('id');
    if (!id) return;
    (async () => {
      try {
        const res = await certificateService.get(Number(id));
        const d = (res?.data as { data?: Record<string, string> })?.data;
        if (res.success && d) setF((p) => ({ ...p, ...d }));
      } catch { /* ignore */ }
    })();
  }, [params]);

  const label = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';
  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '__________');
  const todayISO = new Date().toISOString().slice(0, 10);

  // years of residence = (today − resident-since), floored
  const calcYears = (d: string): string => {
    if (!d) return '';
    const from = new Date(d);
    if (isNaN(from.getTime())) return '';
    const now = new Date();
    let y = now.getFullYear() - from.getFullYear();
    const m = now.getMonth() - from.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < from.getDate())) y--;
    return y >= 0 ? String(y) : '0';
  };

  const handleSave = async () => {
    if (!f.name.trim()) { toast.error('अर्जदाराचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'residence',
        cert_name: 'रहिवासी प्रमाणपत्र',
        applicant_name: f.name,
        outward_no: f.outwardNo,
        data: f,
      });
      if (res.success) { toast.success('प्रमाणपत्र जतन झाले (Saved)'); setSaved(true); }
      else toast.error(res.message || 'जतन करताना त्रुटी');
    } catch {
      toast.error('जतन करताना त्रुटी आली');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <ToastContainer />
      <div className={isView ? '' : 'grid grid-cols-1 gap-6 lg:grid-cols-2'}>
        {/* LEFT — entry form (hidden in view/print-only mode) */}
        {!isView && (
        <div className="no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">रहिवासी प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>अर्जदाराचे नाव</label>
              <MarathiInput name="name" value={f.name} onChange={on} className={inp} placeholder="पूर्ण नाव" />
            </div>
            <div>
              <label className={label}>नाते</label>
              <select name="relation" value={f.relation} onChange={on} className={inp}>
                <option value="वडील">वडील</option>
                <option value="पती">पती</option>
                <option value="आई">आई</option>
              </select>
            </div>
            <div>
              <label className={label}>वडील/पतीचे नाव</label>
              <MarathiInput name="parent" value={f.parent} onChange={on} className={inp} placeholder="नाव" />
            </div>
            <div>
              <label className={label}>वय (वर्षे)</label>
              <input type="number" name="age" value={f.age} onChange={on} className={inp} placeholder="वय" />
            </div>
            <div>
              <label className={label}>लिंग</label>
              <select name="gender" value={f.gender} onChange={on} className={inp}>
                <option value="पुरुष">पुरुष</option>
                <option value="स्त्री">स्त्री</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
            <div>
              <label className={label}>गाव / मुक्काम पोस्ट</label>
              <MarathiInput name="village" value={f.village} onChange={on} className={inp} placeholder="गावाचे नाव" />
            </div>
            <div>
              <label className={label}>घर / मालमत्ता क्रमांक</label>
              <input type="text" name="houseNo" value={f.houseNo} onChange={on} className={inp} placeholder="घर क्र." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>संपूर्ण पत्ता</label>
              <MarathiInput name="fullAddress" value={f.fullAddress} onChange={on} className={inp} placeholder="संपूर्ण पत्ता" />
            </div>
            <div>
              <label className={label}>रहिवासी असल्याचा दिनांक (पासून)</label>
              <DatePicker value={f.residentSince} onChange={(val) => setF((p) => ({ ...p, residentSince: val, years: calcYears(val) }))} placeholder="दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>किती वर्षांपासून रहिवासी (आपोआप)</label>
              <input type="text" name="years" value={f.years ? `${f.years} वर्षे` : ''} readOnly placeholder="दिनांकावरून मोजले जाईल"
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
            </div>
            <div>
              <label className={label}>आधार क्रमांक (ऐच्छिक)</label>
              <input type="text" name="aadhaar" value={f.aadhaar} onChange={on} className={inp} placeholder="आधार क्र." />
            </div>
            <div>
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. शाळा प्रवेश" />
            </div>
            <div>
              <label className={label}>जावक क्रमांक</label>
              <input type="text" name="outwardNo" value={f.outwardNo} onChange={on} className={inp} placeholder="जावक क्र." />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {saved ? '✓ जतन झाले (Saved)' : saving ? 'जतन होत आहे...' : 'जतन करा (Save)'}
          </button>
        </div>
        )}

        {/* RIGHT — live preview / print */}
        <div className={isView ? '' : 'lg:sticky lg:top-4 lg:self-start'}>
          <CertificateLayout title="रहिवासी प्रमाणपत्र" outwardNo={f.outwardNo}>
            <p className="text-justify">
              प्रमाणित करण्यात येते की, श्री./श्रीमती <strong>{f.name || '________________'}</strong>{' '}
              {f.relation} <strong>{f.parent || '________________'}</strong>, वय{' '}
              <strong>{f.age || '____'}</strong> वर्षे, लिंग {f.gender}, घर क्र.{' '}
              <strong>{f.houseNo || '____'}</strong>, मु.पो. <strong>{f.village || '____________'}</strong>
              {f.fullAddress ? <>, संपूर्ण पत्ता: <strong>{f.fullAddress}</strong></> : null}, हे/ही{' '}
              {f.residentSince ? <>दिनांक <strong>{fmtDate(f.residentSince)}</strong> पासून </> : null}
              (अंदाजे <strong>{f.years || '____'}</strong> वर्षे) या ग्रामपंचायत हद्दीतील कायमचे रहिवासी आहेत.
            </p>
            {f.aadhaar && (
              <p className="mt-1">आधार क्रमांक: <strong>{f.aadhaar}</strong></p>
            )}
            <p className="mt-4 text-justify">
              सदर व्यक्ती या ग्रामपंचायत हद्दीतील कायमचे रहिवासी असून, सदर माहिती ग्रामपंचायत
              दप्तरी असलेल्या नोंदीवर आधारित आहे. हे प्रमाणपत्र{' '}
              <strong>{f.purpose || '________________'}</strong> या कारणासाठी देण्यात येत आहे.
            </p>
            <p className="mt-4">वरील माहिती ग्रामपंचायत दप्तरी असलेल्या नोंदीनुसार खरी व बरोबर आहे.</p>
          </CertificateLayout>
        </div>
      </div>

      {isView && (
        <p className="no-print mt-4 text-center text-sm text-amber-600">हे प्रमाणपत्र आधीच जतन केलेले आहे — फक्त प्रिंट करता येईल.</p>
      )}
    </div>
  );
};

export default ResidenceCertificate;
