import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import CertificateLayout from './CertificateLayout';

/* मालमत्ता हस्तांतरण प्रमाणपत्र (Property Transfer Certificate). */
const PropertyTransferCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    fromName: '', toName: '', propertyNo: '', address: '',
    transferDate: '', transferReason: 'खरेदी',
    purpose: '', regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

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

  const handleSave = async () => {
    if (!f.toName.trim()) { toast.error('नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'property-transfer',
        cert_name: 'मालमत्ता हस्तांतरण प्रमाणपत्र',
        applicant_name: f.toName,
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
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">मालमत्ता हस्तांतरण प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>पूर्वीच्या मालकाचे नाव</label>
              <MarathiInput name="fromName" value={f.fromName} onChange={on} className={inp} placeholder="पूर्ण नाव" />
            </div>
            <div>
              <label className={label}>नवीन मालकाचे नाव</label>
              <MarathiInput name="toName" value={f.toName} onChange={on} className={inp} placeholder="पूर्ण नाव" />
            </div>
            <div>
              <label className={label}>मालमत्ता क्रमांक</label>
              <input type="text" name="propertyNo" value={f.propertyNo} onChange={on} className={inp} placeholder="मालमत्ता क्र." />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>संपूर्ण पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="गाव, मु.पो." />
            </div>
            <div>
              <label className={label}>हस्तांतरण दिनांक</label>
              <DatePicker value={f.transferDate} onChange={(val) => setF((p) => ({ ...p, transferDate: val }))} placeholder="हस्तांतरण दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>हस्तांतरणाचे कारण</label>
              <select name="transferReason" value={f.transferReason} onChange={on} className={inp}>
                <option value="खरेदी">खरेदी</option>
                <option value="वारसा">वारसा</option>
                <option value="बक्षीस">बक्षीस</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. नोंद घेणे" />
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
          <CertificateLayout
            title="मालमत्ता हस्तांतरण प्रमाणपत्र"
            subtitle="(Property Transfer Certificate)"
            outwardNo={f.outwardNo}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, मालमत्ता क्रमांक <strong>{f.propertyNo || '________'}</strong>,
              रा. <strong>{f.address || '____________'}</strong>, या मालमत्तेची मालकी श्री./श्रीमती{' '}
              <strong>{f.fromName || '________________'}</strong> यांचेकडून श्री./श्रीमती{' '}
              <strong>{f.toName || '________________'}</strong> यांचे नावे दिनांक{' '}
              <strong>{fmtDate(f.transferDate)}</strong> रोजी <strong>{f.transferReason}</strong> द्वारे
              हस्तांतरित करण्यात आली असून, ग्रामपंचायत दप्तरी त्याची नोंद घेण्यात आली आहे.
            </p>
            <div className="mt-4">
              <Row k="मालमत्ता क्रमांक" v={f.propertyNo || '__________'} />
              <Row k="पूर्वीचा मालक" v={f.fromName || '__________'} />
              <Row k="नवीन मालक" v={f.toName || '__________'} />
              <Row k="हस्तांतरण दिनांक" v={fmtDate(f.transferDate)} />
              <Row k="हस्तांतरणाचे कारण" v={f.transferReason} />
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-4 text-justify">
              हे प्रमाणपत्र <strong>{f.purpose || '________________'}</strong> या कारणासाठी देण्यात
              येत आहे.
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

export default PropertyTransferCertificate;
