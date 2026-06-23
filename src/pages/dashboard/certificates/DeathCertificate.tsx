import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* मृत्यू प्रमाणपत्र — left: fill form, right: live certificate preview.
   Saved to DB (GP-scoped) for records + stats. Uses shared CertificateLayout. */
const DeathCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [f, setF] = useState({
    deceasedName: '', gender: 'पुरुष', age: '', dod: '', placeOfDeath: '',
    relation: 'वडील', parentName: '', address: '',
    applicantName: '', applicantRelation: 'मुलगा', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  // re-view / re-print: if ?id= present, load saved certificate and prefill
  const [params] = useSearchParams();
  const isView = !!params.get('id'); // opened from "जारी केलेली" → print only, no re-save
  const canAdd = can(certModuleKey('death'), 'add');
  const canPrint = can(certModuleKey('death'), 'print');
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

  const handleSave = async () => {
    if (!f.deceasedName.trim()) { toast.error('मृताचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'death',
        cert_name: 'मृत्यू प्रमाणपत्र',
        applicant_name: f.deceasedName,
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
      <span className="w-44 shrink-0">{k}</span><span>:</span>
      <span className="font-semibold">{v}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <ToastContainer />
      <div className={isView ? '' : 'grid grid-cols-1 gap-6 lg:grid-cols-2'}>
        {/* LEFT — entry form (hidden in view/print-only mode) */}
        {!isView && (
        <div className="no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">मृत्यू प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>मृताचे नाव</label>
              <MarathiInput name="deceasedName" value={f.deceasedName} onChange={on} className={inp} placeholder="पूर्ण नाव" />
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
              <label className={label}>वय (वर्षे)</label>
              <input type="number" name="age" value={f.age} onChange={on} className={inp} placeholder="वय" />
            </div>
            <div>
              <label className={label}>मृत्यू दिनांक</label>
              <DatePicker value={f.dod} onChange={(val) => setF((p) => ({ ...p, dod: val }))} placeholder="मृत्यू दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>मृत्यू ठिकाण</label>
              <MarathiInput name="placeOfDeath" value={f.placeOfDeath} onChange={on} className={inp} placeholder="गाव / रुग्णालय" />
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
              <MarathiInput name="parentName" value={f.parentName} onChange={on} className={inp} placeholder="नाव" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कायमचा पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="पूर्ण पत्ता" />
            </div>
            <div>
              <label className={label}>अर्जदाराचे नाव</label>
              <MarathiInput name="applicantName" value={f.applicantName} onChange={on} className={inp} placeholder="अर्ज करणाऱ्याचे नाव" />
            </div>
            <div>
              <label className={label}>अर्जदाराचे मृताशी नाते</label>
              <select name="applicantRelation" value={f.applicantRelation} onChange={on} className={inp}>
                <option value="मुलगा">मुलगा</option>
                <option value="मुलगी">मुलगी</option>
                <option value="पत्नी">पत्नी</option>
                <option value="पती">पती</option>
                <option value="नातू">नातू</option>
                <option value="भाऊ">भाऊ</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. वारसा / पेन्शन" />
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
          {isView ? (
            <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              हे प्रमाणपत्र आधीच जतन केलेले आहे — फक्त प्रिंट करता येईल.
            </p>
          ) : canAdd ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saved ? '✓ जतन झाले (Saved)' : saving ? 'जतन होत आहे...' : 'जतन करा (Save)'}
            </button>
          ) : null}
        </div>
        )}

        {/* RIGHT — live preview / print */}
        <div className={isView ? '' : 'lg:sticky lg:top-4 lg:self-start'}>
          <CertificateLayout
            title="मृत्यू प्रमाणपत्र"
            subtitle="(जन्म-मृत्यू नोंदणी अधिनियम, १९६९ अंतर्गत)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
            verifyToken={verifyToken}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, खालील व्यक्तीची मृत्यू नोंद या ग्रामपंचायतीच्या जन्म-मृत्यू
              नोंदवहीत यथायोग्य नोंदविलेली असून, सदर नोंदीनुसार तपशील खालीलप्रमाणे आहे —
            </p>
            <div className="mt-5">
              <Row k="मृताचे नाव" v={f.deceasedName || '__________'} />
              <Row k="लिंग" v={f.gender} />
              <Row k="वय" v={f.age ? `${f.age} वर्षे` : '____'} />
              <Row k="मृत्यू दिनांक" v={fmtDate(f.dod)} />
              <Row k="मृत्यू ठिकाण" v={f.placeOfDeath || '__________'} />
              <Row k={`${f.relation}चे नाव`} v={f.parentName || '__________'} />
              <Row k="पत्ता" v={f.address || '__________'} />
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-5 text-justify">
              सदर मृत्यूची नोंद जन्म-मृत्यू नोंदणी अधिनियम, १९६९ अन्वये ग्रामपंचायत दप्तरी
              घेण्यात आलेली आहे. हे प्रमाणपत्र मृताचे {f.applicantRelation} श्री./श्रीमती{' '}
              <strong>{f.applicantName || '________________'}</strong> यांच्या विनंतीवरून{' '}
              <strong>{f.purpose || '________________'}</strong> या कारणासाठी देण्यात येत आहे.
            </p>
            <p className="mt-3">वरील माहिती ग्रामपंचायत दप्तरी असलेल्या नोंदीनुसार खरी व बरोबर आहे.</p>
          </CertificateLayout>
        </div>
      </div>
    </div>
  );
};

export default DeathCertificate;
