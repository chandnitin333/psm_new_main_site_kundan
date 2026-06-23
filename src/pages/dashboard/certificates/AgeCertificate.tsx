import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* वय प्रमाणपत्र (Age Certificate) — age auto-calculated from date of birth. */
const AgeCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [f, setF] = useState({
    name: '', relation: 'वडील', parent: '', gender: 'पुरुष',
    dob: '', age: '', placeOfBirth: '', address: '', aadhaar: '', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('age'), 'add');
  const canPrint = can(certModuleKey('age'), 'print');
  useEffect(() => {
    const id = params.get('id');
    if (!id) return;
    (async () => {
      try {
        const res = await certificateService.get(Number(id));
        const row = res?.data as { data?: Record<string, string>; verify_token?: string } | undefined;
        const d = row?.data;
        if (res.success && d) setF((p) => ({ ...p, ...d }));
        if (row?.verify_token) setVerifyToken(row.verify_token);
      } catch { /* ignore */ }
    })();
  }, [params]);

  const label = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';
  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '__________');
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayStr = new Date().toLocaleDateString('en-GB');

  // age = (today − DOB), floored
  const calcAge = (d: string): string => {
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
    if (!f.name.trim()) { toast.error('नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'age',
        cert_name: 'वय प्रमाणपत्र',
        applicant_name: f.name,
        outward_no: f.outwardNo,
        data: f,
      });
      if (res.success) { toast.success('प्रमाणपत्र जतन झाले (Saved)'); setSaved(true); setVerifyToken((res.data as { verify_token?: string })?.verify_token || ''); }
      else toast.error(res.message || 'जतन करताना त्रुटी');
    } catch {
      toast.error('जतन करताना त्रुटी आली');
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex gap-2 py-0.5">
      <span className="w-48 shrink-0">{k}</span><span>:</span>
      <span className="font-semibold">{v}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <ToastContainer />
      <div className={isView ? '' : 'grid grid-cols-1 gap-6 lg:grid-cols-2'}>
        {/* LEFT — entry form */}
        {!isView && (
        <div className="no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">वय प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>नाव</label>
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
              <label className={label}>लिंग</label>
              <select name="gender" value={f.gender} onChange={on} className={inp}>
                <option value="पुरुष">पुरुष</option>
                <option value="स्त्री">स्त्री</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
            <div>
              <label className={label}>जन्म दिनांक</label>
              <DatePicker value={f.dob} onChange={(val) => setF((p) => ({ ...p, dob: val, age: calcAge(val) }))} placeholder="जन्म दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>वय (आपोआप)</label>
              <input type="text" value={f.age ? `${f.age} वर्षे` : ''} readOnly placeholder="जन्म दिनांकावरून"
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
            </div>
            <div>
              <label className={label}>जन्म ठिकाण (ऐच्छिक)</label>
              <MarathiInput name="placeOfBirth" value={f.placeOfBirth} onChange={on} className={inp} placeholder="गाव" />
            </div>
            <div>
              <label className={label}>आधार क्रमांक (ऐच्छिक)</label>
              <input type="text" name="aadhaar" value={f.aadhaar} onChange={on} className={inp} placeholder="आधार क्र." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>संपूर्ण पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="गाव, मु.पो." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. ज्येष्ठ नागरिक योजना" />
            </div>
            <div>
              <label className={label}>नोंदणी क्रमांक</label>
              <input type="text" name="regNo" value={f.regNo} onChange={on} className={inp} placeholder="नोंद क्र." />
            </div>
            <div>
              <label className={label}>नोंदणी दिनांक</label>
              <DatePicker value={f.regDate} onChange={(val) => setF((p) => ({ ...p, regDate: val }))} placeholder="नोंदणी दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>जावक क्रमांक</label>
              <input type="text" name="outwardNo" value={f.outwardNo} onChange={on} className={inp} placeholder="जावक क्र." />
            </div>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saved ? '✓ जतन झाले (Saved)' : saving ? 'जतन होत आहे...' : 'जतन करा (Save)'}
            </button>
          )}
        </div>
        )}

        {/* RIGHT — live preview / print */}
        <div className={isView ? '' : 'lg:sticky lg:top-4 lg:self-start'}>
          <CertificateLayout
            title="वय प्रमाणपत्र"
            subtitle="(Age Certificate)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
            verifyToken={verifyToken}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, श्री./श्रीमती <strong>{f.name || '________________'}</strong>{' '}
              {f.relation} <strong>{f.parent || '________________'}</strong>, रा.{' '}
              <strong>{f.address || '____________'}</strong>, यांची जन्म दिनांक{' '}
              <strong>{fmtDate(f.dob)}</strong> असून, आज दिनांक <strong>{todayStr}</strong> रोजी
              त्यांचे पूर्ण वय <strong>{f.age || '____'}</strong> वर्षे आहे.
            </p>
            <div className="mt-4">
              <Row k="जन्म दिनांक" v={fmtDate(f.dob)} />
              <Row k="वय (आजपर्यंत)" v={f.age ? `${f.age} वर्षे` : '____'} />
              {f.placeOfBirth ? <Row k="जन्म ठिकाण" v={f.placeOfBirth} /> : null}
              {f.aadhaar ? <Row k="आधार क्रमांक" v={f.aadhaar} /> : null}
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-4 text-justify">
              सदर माहिती ग्रामपंचायत दप्तरी असलेल्या जन्म नोंदी / उपलब्ध अभिलेखाच्या आधारे देण्यात
              आली असून, हे प्रमाणपत्र <strong>{f.purpose || '________________'}</strong> या कारणासाठी
              देण्यात येत आहे.
            </p>
            <p className="mt-3">वरील माहिती ग्रामपंचायत दप्तरी असलेल्या नोंदीनुसार खरी व बरोबर आहे.</p>
          </CertificateLayout>
        </div>
      </div>

      {isView && (
        <p className="no-print mt-4 text-center text-sm text-amber-600">हे प्रमाणपत्र आधीच जतन केलेले आहे — फक्त प्रिंट करता येईल.</p>
      )}
    </div>
  );
};

export default AgeCertificate;
