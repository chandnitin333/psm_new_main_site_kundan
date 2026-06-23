import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* दारिद्र्य रेषेखालील (BPL) प्रमाणपत्र — left: fill, right: live preview.
   Confirms the family is in the BPL list (per GP/BPL survey records). GP-scoped DB. */
const BPLCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [f, setF] = useState({
    name: '', relation: 'वडील', parent: '', age: '', gender: 'पुरुष',
    address: '', members: '', annualIncome: '',
    rationCardType: 'दारिद्र्य रेषेखालील (BPL)', rationCardNo: '',
    bplSerial: '', surveyYear: '', aadhaar: '', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  // re-view / re-print
  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('bpl'), 'add');
  const canPrint = can(certModuleKey('bpl'), 'print');
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
    if (!f.name.trim()) { toast.error('अर्जदाराचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'bpl',
        cert_name: 'दारिद्र्य रेषेखालील प्रमाणपत्र',
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
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">दारिद्र्य रेषेखालील प्रमाणपत्र — तपशील भरा</h2>
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
              <label className={label}>कुटुंबातील सदस्य संख्या</label>
              <input type="number" name="members" value={f.members} onChange={on} className={inp} placeholder="संख्या" />
            </div>
            <div>
              <label className={label}>वार्षिक उत्पन्न (रु.)</label>
              <input type="number" name="annualIncome" value={f.annualIncome} onChange={on} className={inp} placeholder="रक्कम" />
            </div>
            <div>
              <label className={label}>रेशन कार्ड प्रकार</label>
              <select name="rationCardType" value={f.rationCardType} onChange={on} className={inp}>
                <option value="अंत्योदय (AAY)">अंत्योदय (AAY)</option>
                <option value="दारिद्र्य रेषेखालील (BPL)">दारिद्र्य रेषेखालील (BPL)</option>
                <option value="प्राधान्य कुटुंब (PHH)">प्राधान्य कुटुंब (PHH)</option>
              </select>
            </div>
            <div>
              <label className={label}>रेशन कार्ड क्रमांक</label>
              <input type="text" name="rationCardNo" value={f.rationCardNo} onChange={on} className={inp} placeholder="कार्ड क्र." />
            </div>
            <div>
              <label className={label}>BPL यादी अनुक्रमांक</label>
              <input type="text" name="bplSerial" value={f.bplSerial} onChange={on} className={inp} placeholder="अनुक्रमांक" />
            </div>
            <div>
              <label className={label}>सर्वेक्षण वर्ष</label>
              <input type="text" name="surveyYear" value={f.surveyYear} onChange={on} className={inp} placeholder="उदा. 2011" />
            </div>
            <div>
              <label className={label}>आधार क्रमांक (ऐच्छिक)</label>
              <input type="text" name="aadhaar" value={f.aadhaar} onChange={on} className={inp} placeholder="आधार क्र." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. शासकीय योजना" />
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
            title="दारिद्र्य रेषेखालील प्रमाणपत्र"
            subtitle="(Below Poverty Line — BPL Certificate)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
            verifyToken={verifyToken}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, श्री./श्रीमती <strong>{f.name || '________________'}</strong>{' '}
              {f.relation} <strong>{f.parent || '________________'}</strong>, वय{' '}
              <strong>{f.age || '____'}</strong> वर्षे, रा. <strong>{f.address || '____________'}</strong>,
              हे/ही या ग्रामपंचायत हद्दीतील रहिवासी असून, त्यांचे कुटुंब शासनाच्या दारिद्र्य
              रेषेखालील (BPL) यादीमध्ये अनुक्रमांक <strong>{f.bplSerial || '____'}</strong>
              {f.surveyYear ? <> (सर्वेक्षण वर्ष {f.surveyYear})</> : null} वर समाविष्ट आहे.
            </p>
            <div className="mt-4">
              <Row k="कुटुंबातील सदस्य संख्या" v={f.members || '____'} />
              <Row k="कुटुंबाचे वार्षिक उत्पन्न" v={f.annualIncome ? `रु. ${f.annualIncome}` : 'रु. ________'} />
              <Row k="रेशन कार्ड प्रकार" v={f.rationCardType} />
              <Row k="रेशन कार्ड क्रमांक" v={f.rationCardNo || '__________'} />
              {f.aadhaar ? <Row k="आधार क्रमांक" v={f.aadhaar} /> : null}
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-4 text-justify">
              सदर माहिती ग्रामपंचायत दप्तरी व दारिद्र्य रेषेखालील सर्वेक्षण यादीच्या आधारे
              देण्यात आली असून, हे प्रमाणपत्र <strong>{f.purpose || '________________'}</strong> या
              कारणासाठी देण्यात येत आहे.
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

export default BPLCertificate;
