import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* जन्म प्रमाणपत्र — left: fill form, right: live preview. Saved to DB (GP-scoped). */
const BirthCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    childName: '', gender: 'पुरुष', dob: '', placeOfBirth: '',
    fatherName: '', motherName: '', address: '', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  // re-view / re-print: if ?id= present, load the saved certificate and prefill
  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('birth'), 'add');
  const canPrint = can(certModuleKey('birth'), 'print');
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
    if (!f.childName.trim()) { toast.error('अपत्याचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'birth',
        cert_name: 'जन्म प्रमाणपत्र',
        applicant_name: f.childName,
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
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">जन्म प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>अपत्याचे नाव</label>
              <MarathiInput name="childName" value={f.childName} onChange={on} className={inp} placeholder="बाळाचे नाव" />
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
              <DatePicker value={f.dob} onChange={(val) => setF((p) => ({ ...p, dob: val }))} placeholder="जन्म दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>जन्म ठिकाण</label>
              <MarathiInput name="placeOfBirth" value={f.placeOfBirth} onChange={on} className={inp} placeholder="गाव / रुग्णालय" />
            </div>
            <div>
              <label className={label}>वडिलांचे नाव</label>
              <MarathiInput name="fatherName" value={f.fatherName} onChange={on} className={inp} placeholder="वडिलांचे नाव" />
            </div>
            <div>
              <label className={label}>आईचे नाव</label>
              <MarathiInput name="motherName" value={f.motherName} onChange={on} className={inp} placeholder="आईचे नाव" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कायमचा पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="पूर्ण पत्ता" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. शाळा प्रवेश" />
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
            title="जन्म प्रमाणपत्र"
            subtitle="(जन्म-मृत्यू नोंदणी अधिनियम, १९६९ अंतर्गत)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, खालील व्यक्तीची जन्म नोंद या ग्रामपंचायतीच्या जन्म-मृत्यू
              नोंदवहीत यथायोग्य नोंदविलेली असून, सदर नोंदीनुसार तपशील खालीलप्रमाणे आहे —
            </p>
            <div className="mt-5">
              <Row k="अपत्याचे नाव" v={f.childName || '__________'} />
              <Row k="लिंग" v={f.gender} />
              <Row k="जन्म दिनांक" v={fmtDate(f.dob)} />
              <Row k="जन्म ठिकाण" v={f.placeOfBirth || '__________'} />
              <Row k="वडिलांचे नाव" v={f.fatherName || '__________'} />
              <Row k="आईचे नाव" v={f.motherName || '__________'} />
              <Row k="पत्ता" v={f.address || '__________'} />
              <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
              <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
            </div>
            <p className="mt-5 text-justify">
              सदर जन्माची नोंद जन्म-मृत्यू नोंदणी अधिनियम, १९६९ अन्वये ग्रामपंचायत दप्तरी
              घेण्यात आलेली आहे. हे प्रमाणपत्र <strong>{f.purpose || '________________'}</strong> या
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

export default BirthCertificate;
