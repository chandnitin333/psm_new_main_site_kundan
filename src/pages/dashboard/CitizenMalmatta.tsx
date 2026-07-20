import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Image as ImageIcon, History, Home, Hash, User, IndianRupee, Pencil, X, Save, Plus, Trash2 } from 'lucide-react';
import PrintModal from './malmatta-nodni/PrintModal';
import ImageUploadModal from './malmatta-nodni/ImageUploadModal';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../contexts/LoadingContext';
import { trackAction } from '../../utils/tracker';
import { nodniService } from '../../services';
import { config } from '../../config';
import type { MalmattaRecord } from '../../interfaces/dashboard/malmatta-nodni/MalmattaNodni.types';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

type Row = Record<string, unknown>;
type FullRecord = MalmattaRecord & Row & {
  khula_bhukhand_kar_aakarani?: Row[];
  bandkamachi_kar_aakarani?: Row[];
  manoryache_kar_aakarani?: Row[];
  other_tax_calculation?: Row[];
  family_details?: Row[];
};

const isEmpty = (v: unknown) => v === null || v === undefined || v === '';
const show = (v: unknown) => (isEmpty(v) ? '-' : String(v));
/** Format a numeric-ish value as ₹ amount; falls back to '-' */
const money = (v: unknown) => {
  if (isEmpty(v)) return '-';
  const n = Number(v);
  return Number.isFinite(n) ? `₹ ${n.toLocaleString('en-IN')}` : String(v);
};

/** Compact label/value cell */
const Cell = ({ label, value }: { label: string; value: unknown }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
    <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">{show(value)}</p>
  </div>
);

/** Grouped section with a heading and a responsive grid of cells */
const Section = ({
  title, cells,
}: { title: string; cells: { label: string; value: unknown }[] }) => (
  <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
    <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">{title}</h4>
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
      {cells.map((c) => <Cell key={c.label} label={c.label} value={c.value} />)}
    </div>
  </div>
);

/** Yes/No (होय/नाही) flag pill */
const Flag = ({ label, value }: { label: string; value: unknown }) => {
  const v = String(value ?? '').trim();
  const yes = v === 'होय';
  const no = v === 'नाही';
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/40">
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          yes ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : no ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {v || '-'}
      </span>
    </div>
  );
};

/** One aakarani (modal-filled) record shown as a labelled mini-grid */
const AakaraniBlock = ({
  title, records, fields,
}: { title: string; records?: Row[]; fields: { label: string; key: string; money?: boolean }[] }) => {
  if (!records || records.length === 0) return null;
  return (
    <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
      <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">{title}</h4>
      <div className="space-y-3">
        {records.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-3 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              {fields.map((f) => (
                <Cell key={f.key} label={f.label} value={f.money ? money(r[f.key]) : r[f.key]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KHULA_FIELDS = [
  { label: 'मालमत्तेचे प्रकार', key: 'malmatteche_prakar_name' },
  { label: 'वर्णन', key: 'malmatteche_varnan_name' },
  { label: 'वापर प्रकार', key: 'vapar_prakar' },
  { label: 'गाव', key: 'gavache_nav_name' },
  { label: 'गावठाण बाहेर', key: 'gavthan_baher_name' },
  { label: 'एकूण क्षेत्रफळ (चौ.फूट)', key: 'ekun_shetrafal_choras_foot' },
  { label: 'जमिनीचे वार्षिक मूल्य', key: 'jaminiche_varshik_mulya', money: true },
  { label: 'आकारणी दर', key: 'aakarani_dar' },
];
const BANDKAM_FIELDS = [
  { label: 'मालमत्तेचे प्रकार', key: 'malmatteche_prakar_name' },
  { label: 'वर्णन', key: 'malmatteche_varnan_name' },
  { label: 'वापर प्रकार', key: 'vapar_prakar' },
  { label: 'मजला', key: 'bandkam_majla_name' },
  { label: 'एकूण क्षेत्रफळ (चौ.फूट)', key: 'ekun_shetrafal_choras_foot' },
  { label: 'वयोमान', key: 'vayoman' },
  { label: 'बांधकाम वर्ष', key: 'imaratiche_bankam_varsh' },
  { label: 'घसारा दर', key: 'ghasara_dar' },
  { label: 'भारांक', key: 'bharank' },
  { label: 'इमारतीचे वार्षिक मूल्य', key: 'imaratiche_varshik_mulya', money: true },
  { label: 'आकारणी दर', key: 'aakarani_dar' },
];
const FAMILY_FIELDS = [
  { label: 'नाव', key: 'name' },
  { label: 'मोबाईल', key: 'mobile' },
  { label: 'वय', key: 'age' },
  { label: 'आधार कार्ड नं', key: 'aadhar_card_number' },
  { label: 'पॅन कार्ड नं', key: 'pan_card_number' },
];
const MANORYACHE_FIELDS = [
  { label: 'मालमत्तेचे प्रकार', key: 'malmatteche_prakar_name' },
  { label: 'वर्णन', key: 'malmatteche_varnan_name' },
  { label: 'वापर प्रकार', key: 'vapar_prakar' },
  { label: 'भाग', key: 'manoryache_bhag_name' },
  { label: 'एकूण क्षेत्रफळ (चौ.फूट)', key: 'ekun_shetrafal_choras_foot' },
  { label: 'मजला', key: 'majla' },
  { label: 'आकारणी दर', key: 'aakarani_dar' },
];

const CitizenMalmatta = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [records, setRecords] = useState<FullRecord[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FullRecord | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  // Edit drawer (currently only चतु:सीमा / boundaries)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRec, setEditRec] = useState<FullRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [boundary, setBoundary] = useState({
    purv: '', paschim: '', uttar: '', dakshin: '',
    matdar_card_number: '', aadahar_card_number: '', alternate_mobile_number: '',
  });
  type FamRow = { name: string; mobile: string; age: string; aadhar_card_number: string; pan_card_number: string };
  const [familyDraft, setFamilyDraft] = useState<FamRow[]>([]);

  const fetchImage = async (id: number) => {
    try {
      const resp = await nodniService.getImagesByNodni(id);
      const imgs = (resp.data as { image_path: string }[]) || [];
      if (imgs.length > 0) {
        setImages((prev) => ({ ...prev, [id]: `${backendBase}/${imgs[0].image_path}?t=${Date.now()}` }));
        return `${backendBase}/${imgs[0].image_path}`;
      }
    } catch { /* ignore */ }
    return null;
  };

  useEffect(() => {
    document.title = 'माझी मालमत्ता / My Property';
    (async () => {
      try {
        const res = await nodniService.getMyProperties() as {
          success: boolean; data?: { records: MalmattaRecord[] };
        };
        const list = res?.success && res.data?.records ? res.data.records : [];
        // enrich each record with full detail (aakarani arrays) + image
        const enriched = await Promise.all(list.map(async (base) => {
          let full: FullRecord = { ...(base as FullRecord) };
          try {
            const det = await nodniService.getById(base.id) as { success: boolean; data?: FullRecord };
            if (det?.success && det.data) full = { ...full, ...det.data };
          } catch { /* keep base */ }
          fetchImage(base.id);
          return full;
        }));
        setRecords(enriched);
      } catch {
        setRecords([]);
        toast.error('माहिती लोड करताना त्रुटी / Error loading your property');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrint = (record: FullRecord) => {
    trackAction('नागरिक — मालमत्ता प्रिंट उघडली (Citizen print open)', { page: '/my-property', nodni_id: record.id });
    setSelectedRecord(record);
    setIsPrintModalOpen(true);
  };

  const handleImageUpload = async (record: FullRecord) => {
    trackAction('नागरिक — फोटो अपलोड उघडले (Citizen image open)', { page: '/my-property', nodni_id: record.id });
    setSelectedRecord(record);
    setExistingImageUrl(images[record.id] || null);
    if (!images[record.id]) await fetchImage(record.id).then((u) => setExistingImageUrl(u));
    setIsImageUploadModalOpen(true);
  };

  const handleImageUploadSave = async (data: { imageFile: File | null }) => {
    if (!data.imageFile) {
      toast.error('कृपया इमेज निवडा (Please select an image)');
      return;
    }
    if (!selectedRecord) return;
    try {
      showLoader('इमेज अपलोड करत आहे... (Uploading image...)');
      await nodniService.uploadImage(selectedRecord.id, data.imageFile);
      await fetchImage(selectedRecord.id); // refresh inline preview
      hideLoader();
      setIsImageUploadModalOpen(false);
      setSelectedRecord(null);
      toast.success('इमेज यशस्वीरित्या अपलोड केली (Image uploaded successfully)');
    } catch (error) {
      hideLoader();
      toast.error((error as { message?: string })?.message || 'इमेज अपलोड अयशस्वी (Image upload failed)');
    }
  };

  // Lock outer page scroll while the drawer is open (only the drawer scrolls)
  useEffect(() => {
    if (drawerOpen) {
      const prevBody = document.body.style.overflow;
      const prevHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevHtml;
      };
    }
  }, [drawerOpen]);

  const openEdit = (rec: FullRecord) => {
    const v = (x: unknown) => (isEmpty(x) ? '' : String(x));
    setEditRec(rec);
    setBoundary({
      purv: v(rec.purv),
      paschim: v(rec.paschim),
      uttar: v(rec.uttar),
      dakshin: v(rec.dakshin),
      matdar_card_number: v(rec.matdar_card_number),
      aadahar_card_number: v(rec.aadahar_card_number),
      alternate_mobile_number: v(rec.alternate_mobile_number),
    });
    setFamilyDraft((rec.family_details || []).map((f) => ({
      name: v(f.name), mobile: v(f.mobile), age: v(f.age),
      aadhar_card_number: v(f.aadhar_card_number), pan_card_number: v(f.pan_card_number),
    })));
    setDrawerOpen(true);
  };

  const addFamRow = () => setFamilyDraft((p) => [...p, { name: '', mobile: '', age: '', aadhar_card_number: '', pan_card_number: '' }]);
  const removeFamRow = (i: number) => setFamilyDraft((p) => p.filter((_, idx) => idx !== i));
  const setFamField = (i: number, k: keyof FamRow, val: string) =>
    setFamilyDraft((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: val } : r)));

  // client-side validation for the ID fields (blank is allowed)
  const aadharVal = boundary.aadahar_card_number.trim();
  const voterVal = boundary.matdar_card_number.trim().toUpperCase();
  const altVal = boundary.alternate_mobile_number.trim();
  const aadharInvalid = aadharVal !== '' && !/^\d{12}$/.test(aadharVal);
  const voterInvalid = voterVal !== '' && !/^[A-Z]{3}[0-9]{7}$/.test(voterVal);
  const altInvalid = altVal !== '' && altVal.split(',').map((s) => s.trim()).filter(Boolean).some((p) => !/^\d{10}$/.test(p));
  const editInvalid = aadharInvalid || voterInvalid || altInvalid;

  const closeEdit = () => { setDrawerOpen(false); setEditRec(null); };

  const handleEditSave = async () => {
    if (!editRec) return;
    if (editInvalid) {
      toast.error('कृपया आधार / मतदार क्रमांक तपासा / Please fix Aadhar / Voter ID');
      return;
    }
    setIsSaving(true);
    try {
      // keep only family rows that have at least one value
      const cleanFamily = familyDraft.filter((f) =>
        [f.name, f.mobile, f.age, f.aadhar_card_number, f.pan_card_number].some((x) => (x || '').trim() !== ''));
      const payload = {
        purv: boundary.purv.trim(),
        paschim: boundary.paschim.trim(),
        uttar: boundary.uttar.trim(),
        dakshin: boundary.dakshin.trim(),
        matdar_card_number: voterVal,
        aadahar_card_number: aadharVal,
        alternate_mobile_number: altVal,
        family_details: cleanFamily,
      };
      const res = await nodniService.updateMyProperty(editRec.id, payload);
      if (res?.success) {
        // reflect changes locally without a full reload
        setRecords((prev) => prev.map((r) => (r.id === editRec.id ? { ...r, ...payload } : r)));
        trackAction('नागरिक — चतु:सीमा अपडेट केली (Citizen boundary update)', { page: '/my-property', nodni_id: editRec.id });
        toast.success('माहिती यशस्वीरित्या अपडेट केली / Updated successfully');
        closeEdit();
      } else {
        toast.error(res?.message || 'अपडेट अयशस्वी / Update failed');
      }
    } catch (error) {
      toast.error((error as { message?: string })?.message || 'अपडेट अयशस्वी / Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">माझी मालमत्ता / My Property</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              तुमच्या नावावरील मालमत्तेची संपूर्ण नोंदणी माहिती / Your complete registered property details
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-600 dark:bg-gray-800">
              <Home className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">कोणतीही मालमत्ता आढळली नाही</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                तुमच्या मोबाईल / आधार क्रमांकाशी जुळणारी नोंदणी सापडली नाही.<br />
                No property is linked to your mobile / Aadhar number.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {records.map((rec) => (
                <div key={rec.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  {/* Card header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-base font-bold text-gray-900 dark:text-white">
                          <User className="h-4 w-4 text-gray-400" />
                          {show(rec.ghar_malkache_nav)}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Hash className="h-3.5 w-3.5" /> मिळकत क्र.: {show(rec.malmatta_number)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(rec)}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        title="संपादित करा (Edit)">
                        <Pencil className="h-4 w-4" /> संपादित
                      </button>
                      <button type="button" onClick={() => navigate(`/property-history?id=${rec.id}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                        title="इतिहास (History)">
                        <History className="h-4 w-4" /> इतिहास
                      </button>
                      <button type="button" onClick={() => handlePrint(rec)}
                        className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                        title="प्रिंट (Print)">
                        <Printer className="h-4 w-4" /> प्रिंट
                      </button>
                      <button type="button" onClick={() => handleImageUpload(rec)}
                        className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        title="इमेज (Image)">
                        <ImageIcon className="h-4 w-4" /> इमेज
                      </button>
                    </div>
                  </div>

                  {/* Property image (if uploaded) */}
                  {images[rec.id] && (
                    <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                      <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">मालमत्तेचा फोटो / Property Image</h4>
                      <img
                        src={images[rec.id]}
                        alt="Property"
                        className="max-h-72 w-auto rounded-xl border border-gray-200 object-contain dark:border-gray-600"
                      />
                    </div>
                  )}

                  <Section
                    title="मालमत्ता माहिती / Property Info"
                    cells={[
                      { label: 'अनु क्रमांक', value: rec.anu_kramank },
                      { label: 'वॉर्ड क्र.', value: rec.ward_kramnak },
                      { label: 'मिळकत क्र.', value: rec.malmatta_number },
                      { label: 'प्लॉट क्र.', value: rec.plot_number },
                      { label: 'खसरा क्र.', value: rec.khasara_number },
                      { label: 'सर्वे क्र.', value: rec.survey_number },
                      { label: 'मतदार कार्ड नं', value: rec.matdar_card_number },
                      { label: 'मोबाईल नं', value: rec.mobile_number },
                      { label: 'पर्यायी मोबाईल नं', value: rec.alternate_mobile_number },
                      { label: 'आधार कार्ड नं', value: rec.aadahar_card_number },
                      { label: 'घर मालकाचे नाव', value: rec.ghar_malkache_nav },
                      { label: 'पत्नी/मुलाचे नाव', value: rec.patni_mulache_nav },
                      { label: 'भोगवटदाराचे नाव', value: rec.bhogavat_darache_nav },
                      { label: 'नगर/लेआउट/सोसायटी', value: rec.patta_nagar_layout_society },
                      { label: 'कायमचा पत्ता', value: rec.kayamcha_patta },
                    ]}
                  />

                  {/* Family members */}
                  <AakaraniBlock title="कुटुंब तपशील / Family Details" records={rec.family_details} fields={FAMILY_FIELDS} />

                  <Section
                    title="चतु:सीमा / Boundaries"
                    cells={[
                      { label: 'पूर्वेस', value: rec.purv },
                      { label: 'पश्चिमेस', value: rec.paschim },
                      { label: 'उत्तरेस', value: rec.uttar },
                      { label: 'दक्षिणेस', value: rec.dakshin },
                    ]}
                  />

                  <Section
                    title="सुविधा व प्रकार / Facilities & Type"
                    cells={[
                      { label: 'पिण्याच्या पाण्याची व्यवस्था', value: rec.pinyacha_panyachi_vyavastha },
                      { label: 'वाणिज्य प्रकार', value: rec.vanijya_prakar },
                      { label: 'मिळकत प्रकार', value: rec.milkat_prakar },
                    ]}
                  />

                  {/* Radio-button (होय/नाही) flags */}
                  <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                    <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">वापर व सूट तपशील / Usage & Exemptions</h4>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <Flag label="घरी शौचालय आहे का?" value={rec.ghari_souychalaya} />
                      <Flag label="इमारत/मोकळी जागा दळण किंवा इतर प्रयोजनासाठी वापरली जाते का?" value={rec.imarat_kiva_mokdi_jaga} />
                      <Flag label="इमारत/जमीन केवळ धार्मिक/शैक्षणिक प्रयोजनासाठी वापरली जाते का?" value={rec.imarat_jamin_keval_dharmik_shekshink} />
                      <Flag label="भोगवटदार शौर्य/सेवा पदक धारक आहे का?" value={rec.bhogvatdar_sarkarsasan_dalatil} />
                      <Flag label="शासकीय/सामाजिक/धार्मिक इमारत किंवा सेवानिवृत्त अधिकारी आहे का?" value={rec.shaskiy_samajik_sevanivrut_imarat} />
                    </div>
                  </div>

                  <Section
                    title="एकूण जागेची क्षेत्रफळ / Area"
                    cells={[
                      { label: 'लांबी', value: rec.lambi },
                      { label: 'रुंदी', value: rec.rundi },
                      { label: 'क्षेत्रफळ (चौ.फूट)', value: rec.shetrafal_choras_foot },
                      { label: 'क्षेत्रफळ (चौ.मीटर)', value: rec.shetrafal_choras_meter },
                      { label: 'उर्वरित खाली जागा (चौ.फूट)', value: rec.urvarit_khali_jaga_choras_foot },
                    ]}
                  />

                  {/* Modal-filled aakarani records */}
                  <AakaraniBlock title="खुला भूखंड कर आकारणी / Open Plot Assessment" records={rec.khula_bhukhand_kar_aakarani} fields={KHULA_FIELDS} />
                  <AakaraniBlock title="बांधकामाची कर आकारणी / Construction Assessment" records={rec.bandkamachi_kar_aakarani} fields={BANDKAM_FIELDS} />
                  <AakaraniBlock title="मनोऱ्याचे कर आकारणी / Tower Assessment" records={rec.manoryache_kar_aakarani} fields={MANORYACHE_FIELDS} />

                  <Section
                    title="भांडवली मूल्य / Capital Value"
                    cells={[
                      { label: 'जमिनीचे भांडवली मूल्य', value: money(rec.jaminiche_bhandvali_mulya) },
                      { label: 'इमारतीचे भांडवली मूल्य', value: money(rec.imaratiche_bhandvali_mulya) },
                      { label: 'एकूण भांडवली मूल्य', value: money(rec.ekun_bhandvali_mulya) },
                    ]}
                  />

                  {/* इतर कर गणना — only the taxes that were actually selected (have a name) */}
                  {(() => {
                    const otherTax = (rec.other_tax_calculation || []).filter((t) => !isEmpty(t.tax_name));
                    if (otherTax.length === 0) return null;
                    const otherTotal = otherTax.reduce((sum, t) => sum + (Number(t.tax_rate) || 0), 0);
                    return (
                      <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">इतर कर गणना / Other Tax Calculation</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {otherTax.map((t, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                  <IndianRupee className="h-4 w-4" />
                                </span>
                                <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{show(t.tax_name)}</span>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">{money(t.tax_rate)}</span>
                            </div>
                          ))}
                        </div>
                        {/* इतर कर एकूण */}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 dark:border-primary-800 dark:bg-primary-900/30">
                          <span className="text-sm font-semibold text-primary-800 dark:text-primary-200">इतर कर एकूण / Total Other Tax</span>
                          <span className="text-base font-bold text-primary-800 dark:text-primary-200">{money(otherTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tax section with highlighted total */}
                  <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                    <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">कर आकारणी / Tax Assessment</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
                      <Cell label="खुला भूखंड आकारणी" value={money(rec.khula_bhukhand_aakarani)} />
                      <Cell label="इमारतीची कर आकारणी" value={money(rec.imaratiche_kar_aakarani)} />
                      <Cell label="गृहकर व भूमिकर" value={money(rec.gruhkar_v_bhumikar)} />
                      <Cell label="कर (गृहकर व भूमिकर)" value={money(rec.kar_gruhkar_v_bhumikar)} />
                      <Cell label="चालू कर" value={money(rec.chalu_kar)} />
                      <Cell label="मागील बाकी" value={money(rec.magil_baki)} />
                      <Cell label="मागाहून घट/बदल" value={money(rec.magahun_ghat_kiva_badal)} />
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-600 px-5 py-3 text-white">
                      <span className="text-sm font-semibold sm:text-base">एकूण कर भरणे / Total Tax Payable</span>
                      <span className="text-lg font-bold sm:text-xl">{money(rec.ekun_kar_bharne)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => { setIsPrintModalOpen(false); setSelectedRecord(null); }}
        record={selectedRecord}
      />

      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => { setIsImageUploadModalOpen(false); setSelectedRecord(null); setExistingImageUrl(null); }}
        onSave={handleImageUploadSave}
        khatedharkacheNav={(selectedRecord as (FullRecord & { ghar_malkache_nav?: string }) | null)?.ghar_malkache_nav || ''}
        existingImageUrl={existingImageUrl}
      />

      {/* Edit drawer — slides in from the right. z above the PWA install button (z-[1000]) so it stays on top. */}
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-[1001] bg-black/40 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeEdit}
      />
      {/* panel */}
      <div
        className={`fixed right-0 top-0 z-[1002] flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-800 sm:w-[75%] ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary-600 px-5 py-4 text-white dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold">माहिती संपादित करा / Edit</h3>
            <p className="text-xs text-white/80">{show(editRec?.ghar_malkache_nav)} · मिळकत {show(editRec?.malmatta_number)}</p>
          </div>
          <button type="button" onClick={closeEdit} className="rounded-lg p-1.5 hover:bg-white/20" title="बंद करा (Close)">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {/* Identity & contact — one row */}
          <h4 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">ओळख व संपर्क / Identity & Contact</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">मतदार कार्ड नं / Voter ID</label>
              <input
                type="text"
                value={boundary.matdar_card_number}
                onChange={(e) => setBoundary((b) => ({ ...b, matdar_card_number: e.target.value.toUpperCase() }))}
                maxLength={10}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white ${
                  voterInvalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-gray-600'
                }`}
                placeholder="ABC1234567"
              />
              <p className={`mt-1 text-[11px] ${voterInvalid ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                {voterInvalid ? 'स्वरूप: ABC1234567' : '३ अक्षरे + ७ अंक'}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">आधार कार्ड नं / Aadhar</label>
              <input
                type="text"
                inputMode="numeric"
                value={boundary.aadahar_card_number}
                onChange={(e) => setBoundary((b) => ({ ...b, aadahar_card_number: e.target.value.replace(/\D/g, '') }))}
                maxLength={12}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white ${
                  aadharInvalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-gray-600'
                }`}
                placeholder="१२ अंकी आधार क्रमांक"
              />
              <p className={`mt-1 text-[11px] ${aadharInvalid ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                {aadharInvalid ? '१२ अंकी असावा' : '१२ अंक'}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">पर्यायी मोबाईल / Alternate</label>
              <input
                type="text"
                value={boundary.alternate_mobile_number}
                onChange={(e) => setBoundary((b) => ({ ...b, alternate_mobile_number: e.target.value.replace(/[^0-9,\s]/g, '') }))}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white ${
                  altInvalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-gray-600'
                }`}
                placeholder="9876543210, 9123456780"
              />
              <p className={`mt-1 text-[11px] ${altInvalid ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                {altInvalid ? 'प्रत्येक १० अंकी' : 'कॉमा (,) ने वेगळे करा'}
              </p>
            </div>
          </div>

          {/* Boundaries — one row */}
          <h4 className="mb-3 mt-6 text-sm font-bold text-primary-700 dark:text-primary-300">चतु:सीमा / Boundaries</h4>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { key: 'purv', label: 'पूर्वेस / East' },
              { key: 'paschim', label: 'पश्चिमेस / West' },
              { key: 'uttar', label: 'उत्तरेस / North' },
              { key: 'dakshin', label: 'दक्षिणेस / South' },
            ] as const).map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{f.label}</label>
                <input
                  type="text"
                  value={boundary[f.key]}
                  onChange={(e) => setBoundary((b) => ({ ...b, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={f.label}
                />
              </div>
            ))}
          </div>

          {/* Family details (dynamic) */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h4 className="text-sm font-bold text-primary-700 dark:text-primary-300">कुटुंब तपशील / Family Details</h4>
            <button
              type="button"
              onClick={addFamRow}
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" /> सदस्य
            </button>
          </div>
          {familyDraft.length === 0 ? (
            <p className="text-xs text-gray-400">सदस्य जोडण्यासाठी "सदस्य" वर क्लिक करा (optional).</p>
          ) : (
            <div className="space-y-2">
              {/* column headings (desktop) */}
              <div className="hidden gap-3 px-1 lg:grid lg:grid-cols-12">
                <span className="col-span-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">नाव / Name</span>
                <span className="col-span-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">मोबाईल</span>
                <span className="col-span-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">वय</span>
                <span className="col-span-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">आधार कार्ड नं</span>
                <span className="col-span-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">पॅन कार्ड नं</span>
                <span className="col-span-1" />
              </div>
              {familyDraft.map((m, i) => (
                <div key={i} className="grid grid-cols-2 items-center gap-3 rounded-xl border border-gray-200 p-2.5 dark:border-gray-700 lg:grid-cols-12">
                  <input value={m.name} onChange={(e) => setFamField(i, 'name', e.target.value)} placeholder="नाव"
                    className="col-span-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white lg:col-span-3" />
                  <input value={m.mobile} inputMode="numeric" maxLength={10}
                    onChange={(e) => setFamField(i, 'mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="मोबाईल"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white lg:col-span-2" />
                  <input value={m.age} inputMode="numeric" maxLength={3}
                    onChange={(e) => setFamField(i, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="वय"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white lg:col-span-1" />
                  <input value={m.aadhar_card_number} inputMode="numeric" maxLength={12}
                    onChange={(e) => setFamField(i, 'aadhar_card_number', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="आधार"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white lg:col-span-3" />
                  <input value={m.pan_card_number} maxLength={10}
                    onChange={(e) => setFamField(i, 'pan_card_number', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="पॅन"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white lg:col-span-2" />
                  <button type="button" onClick={() => removeFamRow(i)} title="काढा (Remove)"
                    className="flex h-9 w-9 items-center justify-center justify-self-end rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 lg:col-span-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={handleEditSave}
            disabled={isSaving || editInvalid}
            title={editInvalid ? 'कृपया आधार / मतदार क्रमांक तपासा' : undefined}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            जतन करा / Save
          </button>
          <button
            type="button"
            onClick={closeEdit}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            रद्द / Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default CitizenMalmatta;
