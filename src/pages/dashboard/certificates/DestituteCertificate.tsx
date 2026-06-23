import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* निराधार प्रमाणपत्र (Destitute) — for Niradhar pension schemes. left: fill, right: live preview. */
const DestituteCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    name: '', relation: 'वडील', parent: '', age: '', gender: 'पुरुष',
    address: '', reason: 'वृद्ध / निराधार', earningMember: 'नाही',
    annualIncome: '', schemeName: '', aadhaar: '', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('destitute'), 'add');
  const canPrint = can(certModuleKey('destitute'), 'print');
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

  const handleSave = async () => {
    if (!f.name.trim()) { toast.error('अर्जदाराचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'destitute',
        cert_name: 'निराधार प्रमाणपत्र',
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

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex gap-2 py-0.5">
      <span className="w-52 shrink-0">{k}</span><span>:</span>
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
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">निराधार प्रमाणपत्र — तपशील भरा</h2>
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
            <div className="sm:col-span-2">
              <label className={label}>संपूर्ण पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="गाव, मु.पो." />
            </div>
            <div>
              <label className={label}>निराधार असल्याचे कारण</label>
              <select name="reason" value={f.reason} onChange={on} className={inp}>
                <option value="वृद्ध / निराधार">वृद्ध / निराधार</option>
                <option value="विधवा">विधवा</option>
                <option value="परित्यक्ता">परित्यक्ता</option>
                <option value="घटस्फोटिता">घटस्फोटिता</option>
                <option value="अपंग / दिव्यांग">अपंग / दिव्यांग</option>
                <option value="अनाथ">अनाथ</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
            <div>
              <label className={label}>कुटुंबात कमावता सदस्य</label>
              <select name="earningMember" value={f.earningMember} onChange={on} className={inp}>
                <option value="नाही">नाही</option>
                <option value="होय">होय</option>
              </select>
            </div>
            <div>
              <label className={label}>वार्षिक उत्पन्न (रु.)</label>
              <input type="number" name="annualIncome" value={f.annualIncome} onChange={on} className={inp} placeholder="रक्कम" />
            </div>
            <div>
              <label className={label}>योजनेचे नाव (ऐच्छिक)</label>
              <MarathiInput name="schemeName" value={f.schemeName} onChange={on} className={inp} placeholder="उदा. संजय गांधी निराधार अनुदान योजना" />
            </div>
            <div>
              <label className={label}>आधार क्रमांक (ऐच्छिक)</label>
              <input type="text" name="aadhaar" value={f.aadhaar} onChange={on} className={inp} placeholder="आधार क्र." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. निराधार पेन्शन योजना" />
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
            title="निराधार प्रमाणपत्र"
            subtitle="(Destitute Certificate — निराधार अनुदान योजनेसाठी)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, श्री./श्रीमती <strong>{f.name || '________________'}</strong>{' '}
              {f.relation} <strong>{f.parent || '________________'}</strong>, वय{' '}
              <strong>{f.age || '____'}</strong> वर्षे, रा. <strong>{f.address || '____________'}</strong>,
              हे/ही या ग्रामपंचायत हद्दीतील रहिवासी असून, ते/त्या <strong>{f.reason}</strong> या कारणाने
              निराधार आहेत. त्यांना उदरनिर्वाहाचे स्वतःचे कोणतेही साधन नसून, कुटुंबात कमावता सदस्य{' '}
              <strong>{f.earningMember}</strong>.
            </p>
            <div className="mt-4">
              <Row k="निराधार असल्याचे कारण" v={f.reason} />
              <Row k="कुटुंबात कमावता सदस्य" v={f.earningMember} />
              <Row k="वार्षिक उत्पन्न" v={f.annualIncome ? `रु. ${f.annualIncome}` : 'रु. ________'} />
              {f.schemeName ? <Row k="योजनेचे नाव" v={f.schemeName} /> : null}
              {f.aadhaar ? <Row k="आधार क्रमांक" v={f.aadhaar} /> : null}
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-4 text-justify">
              सदर माहिती ग्रामपंचायत दप्तरी असलेल्या नोंदी व स्थानिक चौकशीच्या आधारे देण्यात आली
              असून, हे प्रमाणपत्र <strong>{f.purpose || '________________'}</strong> या कारणासाठी
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

export default DestituteCertificate;
