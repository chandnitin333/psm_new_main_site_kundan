import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* नमुना ८ उतारा (Form 8 Extract) — extract of property tax register. */
const Form8ExtractCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    ownerName: '', address: '', propertyNo: '', wardNo: '', area: '',
    annualValue: '', taxAmount: '', year: '',
    purpose: '', regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('form8-extract'), 'add');
  const canPrint = can(certModuleKey('form8-extract'), 'print');
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
    if (!f.ownerName.trim()) { toast.error('नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'form8-extract',
        cert_name: 'नमुना ८ उतारा',
        applicant_name: f.ownerName,
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
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">नमुना ८ उतारा — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>मालकाचे नाव</label>
              <MarathiInput name="ownerName" value={f.ownerName} onChange={on} className={inp} placeholder="पूर्ण नाव" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>संपूर्ण पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="गाव, मु.पो." />
            </div>
            <div>
              <label className={label}>मालमत्ता क्रमांक</label>
              <input type="text" name="propertyNo" value={f.propertyNo} onChange={on} className={inp} placeholder="मालमत्ता क्र." />
            </div>
            <div>
              <label className={label}>प्रभाग</label>
              <input type="text" name="wardNo" value={f.wardNo} onChange={on} className={inp} placeholder="प्रभाग क्र." />
            </div>
            <div>
              <label className={label}>क्षेत्रफळ (चौ.मी.)</label>
              <input type="text" name="area" value={f.area} onChange={on} className={inp} placeholder="क्षेत्रफळ चौ.मी." />
            </div>
            <div>
              <label className={label}>वार्षिक मूल्य (रु.)</label>
              <input type="number" name="annualValue" value={f.annualValue} onChange={on} className={inp} placeholder="वार्षिक मूल्य" />
            </div>
            <div>
              <label className={label}>एकूण कर (रु.)</label>
              <input type="number" name="taxAmount" value={f.taxAmount} onChange={on} className={inp} placeholder="एकूण कर" />
            </div>
            <div>
              <label className={label}>वर्ष</label>
              <input type="text" name="year" value={f.year} onChange={on} className={inp} placeholder="उदा. २०२५-२६" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. कर्जासाठी" />
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
            title="नमुना ८ उतारा"
            subtitle="(Form 8 Extract — मालमत्ता कर नोंदवही उतारा)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
          >
            <p className="text-justify">
              ग्रामपंचायत नमुना ८ नुसार खालील मालमत्तेचा उतारा देण्यात येत आहे —
            </p>
            <div className="mt-4">
              <Row k="मालकाचे नाव" v={f.ownerName || '__________'} />
              <Row k="मालमत्ता क्रमांक" v={f.propertyNo || '__________'} />
              <Row k="प्रभाग" v={f.wardNo || '__________'} />
              <Row k="क्षेत्रफळ" v={f.area || '__________'} />
              <Row k="वार्षिक मूल्य" v={`रु. ${f.annualValue || '________'}`} />
              <Row k="एकूण कर" v={`रु. ${f.taxAmount || '________'}`} />
              <Row k="वर्ष" v={f.year || '__________'} />
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

export default Form8ExtractCertificate;
