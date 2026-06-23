import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarathiInput, DatePicker } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { certificateService } from '../../../services';
import { can, certModuleKey } from '../../../utils/permissions';
import CertificateLayout from './CertificateLayout';

/* विवाह नोंदणी प्रमाणपत्र — left: fill form, right: live preview.
   Saved to DB (GP-scoped). Uses shared CertificateLayout. */
const MarriageCertificate = () => {
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [f, setF] = useState({
    groomName: '', groomAge: '', groomFather: '',
    brideName: '', brideAge: '', brideFather: '',
    marriageDate: '', placeOfMarriage: '', address: '', purpose: '',
    regNo: '', regDate: '', outwardNo: '',
  });
  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  // re-view / re-print: if ?id= present, load saved certificate and prefill (print only)
  const [params] = useSearchParams();
  const isView = !!params.get('id');
  const canAdd = can(certModuleKey('marriage'), 'add');
  const canPrint = can(certModuleKey('marriage'), 'print');
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
    if (!f.groomName.trim() || !f.brideName.trim()) { toast.error('वर व वधू यांचे नाव आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await certificateService.save({
        cert_type: 'marriage',
        cert_name: 'विवाह नोंदणी प्रमाणपत्र',
        applicant_name: `${f.groomName} - ${f.brideName}`,
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
        {/* LEFT — entry form (hidden in view/print-only mode) */}
        {!isView && (
        <div className="no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">विवाह नोंदणी प्रमाणपत्र — तपशील भरा</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>वराचे नाव</label>
              <MarathiInput name="groomName" value={f.groomName} onChange={on} className={inp} placeholder="वराचे पूर्ण नाव" />
            </div>
            <div>
              <label className={label}>वराचे वय</label>
              <input type="number" name="groomAge" value={f.groomAge} onChange={on} className={inp} placeholder="वय" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>वराच्या वडिलांचे नाव</label>
              <MarathiInput name="groomFather" value={f.groomFather} onChange={on} className={inp} placeholder="वडिलांचे नाव" />
            </div>
            <div>
              <label className={label}>वधूचे नाव</label>
              <MarathiInput name="brideName" value={f.brideName} onChange={on} className={inp} placeholder="वधूचे पूर्ण नाव" />
            </div>
            <div>
              <label className={label}>वधूचे वय</label>
              <input type="number" name="brideAge" value={f.brideAge} onChange={on} className={inp} placeholder="वय" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>वधूच्या वडिलांचे नाव</label>
              <MarathiInput name="brideFather" value={f.brideFather} onChange={on} className={inp} placeholder="वडिलांचे नाव" />
            </div>
            <div>
              <label className={label}>विवाह दिनांक</label>
              <DatePicker value={f.marriageDate} onChange={(val) => setF((p) => ({ ...p, marriageDate: val }))} placeholder="विवाह दिनांक" max={todayISO} />
            </div>
            <div>
              <label className={label}>विवाह ठिकाण</label>
              <MarathiInput name="placeOfMarriage" value={f.placeOfMarriage} onChange={on} className={inp} placeholder="गाव / स्थळ" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>पत्ता</label>
              <MarathiInput name="address" value={f.address} onChange={on} className={inp} placeholder="पूर्ण पत्ता" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>कारण / प्रयोजन</label>
              <MarathiInput name="purpose" value={f.purpose} onChange={on} className={inp} placeholder="उदा. कायदेशीर पुरावा" />
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
            title="विवाह नोंदणी प्रमाणपत्र"
            subtitle="(महाराष्ट्र विवाह नोंदणी नियमांनुसार)"
            outwardNo={f.outwardNo}
            canPrint={canPrint}
            verifyToken={verifyToken}
          >
            <p className="text-justify">
              प्रमाणित करण्यात येते की, खालील वर व वधू यांचा विवाह दिनांक{' '}
              <strong>{fmtDate(f.marriageDate)}</strong> रोजी{' '}
              <strong>{f.placeOfMarriage || '__________'}</strong> येथे संपन्न झाला असून, सदर
              विवाहाची नोंद या ग्रामपंचायतीच्या विवाह नोंदवहीत यथायोग्य नोंदविलेली आहे. तपशील
              खालीलप्रमाणे —
            </p>
            <div className="mt-5 flex items-start gap-6">
              <div className="flex-1">
                <Row k="वराचे नाव" v={f.groomName || '__________'} />
                <Row k="वराचे वय" v={f.groomAge ? `${f.groomAge} वर्षे` : '____'} />
                <Row k="वराच्या वडिलांचे नाव" v={f.groomFather || '__________'} />
                <Row k="वधूचे नाव" v={f.brideName || '__________'} />
                <Row k="वधूचे वय" v={f.brideAge ? `${f.brideAge} वर्षे` : '____'} />
                <Row k="वधूच्या वडिलांचे नाव" v={f.brideFather || '__________'} />
                <Row k="विवाह दिनांक" v={fmtDate(f.marriageDate)} />
                <Row k="विवाह ठिकाण" v={f.placeOfMarriage || '__________'} />
                <Row k="पत्ता" v={f.address || '__________'} />
                <Row k="नोंदणी क्रमांक" v={f.regNo || '__________'} />
                <Row k="नोंदणी दिनांक" v={fmtDate(f.regDate)} />
              </div>
              {/* passport photo blocks (paste photo on printed certificate) */}
              <div className="flex shrink-0 flex-col gap-3">
                <div className="flex h-24 w-20 items-center justify-center border border-black text-center text-[11px] text-gray-500">
                  वराचा<br />फोटो
                </div>
                <div className="flex h-24 w-20 items-center justify-center border border-black text-center text-[11px] text-gray-500">
                  वधूचा<br />फोटो
                </div>
              </div>
            </div>
            <p className="mt-5 text-justify">
              सदर विवाहाची नोंद ग्रामपंचायत दप्तरी घेण्यात आलेली असून, हे प्रमाणपत्र{' '}
              <strong>{f.purpose || '________________'}</strong> या कारणासाठी देण्यात येत आहे.
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

export default MarriageCertificate;
