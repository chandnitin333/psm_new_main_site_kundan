import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import config from '../../../config';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

/* मालमत्ता धारकाची यादी — नवीन (card) डिझाईन.
   जुन्या `MalmattaDharkachiReport` सारखाच data व content, पण आधुनिक card layout.
   Data: opener tab कडून sessionStorage('dharkachiYadiCardData') मध्ये येतो; नसल्यास
   params वरून पुन्हा fetch (fallback). Print-friendly A4 portrait. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toLocaleString('en-IN');
};

const sqmOf = (it: Row) => Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903;
const landBhandvali = (it: Row) => sqmOf(it) * Number(it.jaminiche_varshik_mulya || 0);
const consBhandvali = (it: Row) =>
  sqmOf(it) * Number(it.imaratiche_varshik_mulya || 0) * Number(it.bharank || 0);
const manoraKar = (it: Row) =>
  Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1);

type Loc = { district: string; taluka: string; gramPanchayat: string };

/* ---- small presentational helpers ---- */
const Field = ({ label, value, wide, blank }: { label: string; value: unknown; wide?: boolean; blank?: boolean }) => (
  <div className={`dc-field ${wide ? 'dc-wide' : ''}`}>
    <span className="dc-label">{label}</span>
    <span className="dc-value">{blank ? ' ' : (s(value) || '—')}</span>
  </div>
);

/* एका record मध्ये मालमत्तेचे वर्णन खूप rows असल्यास ते एका पानात बसत नाहीत (जास्त shrink
   होऊन बारीक दिसतात). म्हणून view-namuna8-multi प्रमाणे rows ला पानांत विभागतो: header +
   मालक/चतु:सीमा/क्षेत्रफळ प्रत्येक पानावर repeat; कर आकारणी values प्रत्येक पानावर 0 आणि
   खरी रक्कम + फेरफार + टीप फक्त शेवटच्या पानावर. rows कमी असल्यास पूर्वीसारखे एकच पान. */
const DESC_PER_PAGE: Record<'portrait' | 'landscape', number> = { portrait: 8, landscape: 6 };

type Variant = 'dharkachi' | 'namuna8' | 'namuna8new' | 'namuna8images' | 'sarkari' | 'imlakar';
const RecordCard = ({ n, loc, cy, qrUrl, blank = false, variant = 'dharkachi', orient = 'portrait' }: { n: Row; loc: Loc; cy: number; qrUrl?: string; blank?: boolean; variant?: Variant; orient?: 'portrait' | 'landscape' }) => {
  const land = (n.khula_bhukhand_kar_aakarani as Row[]) || [];
  const cons = (n.bandkamachi_kar_aakarani as Row[]) || [];
  const manora = (n.manoryache_kar_aakarani as Row[]) || [];
  const isN8fam = variant === 'namuna8' || variant === 'namuna8images'; // नमुना ८ (टीप + स्वाक्षरी)
  const fourYearSub = isN8fam || variant === 'imlakar'; // 4-वर्ष subtitle वापरणारे
  const showPhoto = variant === 'namuna8images' || variant === 'imlakar';
  const imgs = (n.images as Row[]) || [];
  const imgUrl = !blank && imgs[0]?.image_path ? `${backendBase}/${imgs[0].image_path}` : '';
  const otherTax = (n.other_tax_calculation as Row[]) || [];
  const taxAmt = (id: number) => {
    const r = otherTax.find((t) => Number(t.tax_id) === id);
    return r && r.tax_rate != null ? Number(r.tax_rate) : 0;
  };
  const gruhkarAmt = Number(n.gruhkar_v_bhumikar || 0);
  const vizAmt = taxAmt(1), aarogyaAmt = taxAmt(2), safaiAmt = taxAmt(3);
  const samanyaPaniAmt = taxAmt(4), visheshPaniAmt = taxAmt(5), itarAmt = taxAmt(6);
  const ekunTaxAmt = vizAmt + aarogyaAmt + safaiAmt + samanyaPaniAmt + visheshPaniAmt + itarAmt;
  const grandTotal = gruhkarAmt + ekunTaxAmt;

  const descRows: { kind: string; it: Row }[] = [
    ...land.map((it) => ({ kind: 'जमीन', it })),
    ...cons.map((it) => ({ kind: 'बांधकाम', it })),
    ...manora.map((it) => ({ kind: 'मनोरा', it })),
  ];
  const karOf = (kind: string, it: Row) =>
    kind === 'जमीन' ? landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000
      : kind === 'बांधकाम' ? consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000
        : manoraKar(it);

  const taxChips = [
    { k: 'गृह व भूमीकर', v: gruhkarAmt },
    { k: 'वीज', v: vizAmt },
    { k: 'आरोग्य', v: aarogyaAmt },
    { k: 'सफाई', v: safaiAmt },
    { k: 'सा. पाणी', v: samanyaPaniAmt },
    { k: 'वि. पाणी', v: visheshPaniAmt },
    { k: 'इतर', v: itarAmt },
  ];

  // blank form असल्यास सर्व value रिकामे (हाताने भरण्यासाठी)
  const bv = (v: unknown) => (blank ? ' ' : (s(v) || '—'));

  // ---- pagination ----
  const perPage = DESC_PER_PAGE[orient];
  const pageCount = blank ? 1 : Math.max(1, Math.ceil(descRows.length / perPage) || 1);

  const renderHeader = () => (
    <header className="dc-head">
      <div className="dc-badges">
        <span className="dc-badge"><i>अनु.क्र</i><b>{bv(n.anu_kramank)}</b></span>
        <span className="dc-badge"><i>मालमत्ता</i><b>{bv(n.malmatta_number)}</b></span>
      </div>
      <div className="dc-head-main">
        <h1>{variant === 'imlakar' ? 'इमलाकर मोजमाप यादी' : variant === 'sarkari' ? 'नमुना ८ (सरकारी)' : isN8fam ? 'नमुना ८' : variant === 'namuna8new' ? 'नमुना ८ नियम ३२ (१)' : 'फेरकर आकारणी मुल्यांकन यादी'}</h1>
        <p className="dc-sub">{variant === 'sarkari'
          ? `सरकारी मालमत्ता — कर आकारणी नोंदवही · सन ${fyLabel(cy)}`
          : fourYearSub
          ? `सन ${fyLabel(cy)} ते ${fyLabel(cy + 3)} — करास पात्र इमारती व जमिनी (खुला भूखंड) कर आकारणी नोंदवही${showPhoto ? ' (छायाचित्रासह)' : ''}`
          : variant === 'namuna8new'
            ? `सन ${fyLabel(cy)} साठी कर आकारणी नोंदवही (वैयक्तिक असेसमेंट उतारा पाहण्याकरीता)`
            : `सन ${fyLabel(cy)} · मालमत्ता धारकाची यादी`}</p>
        <p className="dc-loc">
          <span>जिल्हा: <b>{loc.district || '—'}</b></span>
          <span>तालुका: <b>{loc.taluka || '—'}</b></span>
          <span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span>
        </p>
      </div>
      {qrUrl && <span className="dc-qr"><QRCodeSVG value={qrUrl} size={52} level="M" marginSize={0} /></span>}
    </header>
  );

  const renderOwner = () => (
    <section className="dc-sec">
      <h2 className="dc-h2">मालक व मालमत्ता तपशील</h2>
      <div className={`dc-owner-wrap${showPhoto ? ' dc-has-photo' : ''}`}>
        <div className="dc-grid">
          <Field label="घरमालकाचे नाव" value={n.ghar_malkache_nav} wide blank={blank} />
          <Field label="पत्नी / मुलांचे नाव" value={n.patni_mulache_nav} wide blank={blank} />
          <Field label="भोगवटदाराचे नाव" value={n.bhogavat_darache_nav} wide blank={blank} />
          <Field label="पत्ता" value={n.patta_nagar_layout_society} wide blank={blank} />
          <Field label="वार्ड क्र." value={n.ward_kramnak} blank={blank} />
          <Field label="प्लॉट क्र." value={n.plot_number} blank={blank} />
          <Field label="खसरा नं." value={n.khasara_number} blank={blank} />
          <Field label="सर्वे क्र." value={n.survey_number} blank={blank} />
          <Field label="मिलकत प्रकार" value={n.milkat_prakar} blank={blank} />
          <Field label="पाणी व्यवस्था" value={n.pinyacha_panyachi_vyavastha} blank={blank} />
          <Field label="शौचालय" value={n.ghari_souychalaya} blank={blank} />
          <Field label="मोबाईल" value={n.mobile_number} blank={blank} />
          <Field label="आधार" value={n.aadahar_card_number} blank={blank} />
          <Field label="वोटर आयडी" value={n.matdar_card_number} blank={blank} />
        </div>
        {showPhoto && (
          <div className="dc-photo">
            {imgUrl ? <img src={imgUrl} alt="मालमत्ता" /> : <span className="dc-photo-ph">{blank ? 'छायाचित्र' : 'चित्र उपलब्ध नाही'}</span>}
          </div>
        )}
      </div>
    </section>
  );

  const renderSeemaArea = () => (
    <div className="dc-row2">
      <section className="dc-sec">
        <h2 className="dc-h2">चतु:सीमा</h2>
        <div className="dc-seema">
          {[['पूर्वेस', n.purv], ['पश्चिमेस', n.paschim], ['उत्तरेस', n.uttar], ['दक्षिणेस', n.dakshin]].map(([k, v]) => (
            <div key={String(k)} className="dc-seema-box">
              <span className="dc-label">{String(k)}</span>
              <span className="dc-value">{bv(v)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="dc-sec">
        <h2 className="dc-h2">एकूण जागेचे क्षेत्रफळ</h2>
        <div className="dc-stats">
          {[
            ['लांबी', f(n.lambi)], ['रुंदी', f(n.rundi)],
            ['क्षेत्रफळ (चौ.फू)', f(n.shetrafal_choras_foot)], ['मीटर (चौ.मी)', f(n.shetrafal_choras_meter)],
            ['उर्वरित (चौ.फू)', f(n.urvarit_khali_jaga_choras_foot)],
            ['उर्वरित मीटर', f(Number(n.urvarit_khali_jaga_choras_foot || 0) * 0.092903)],
          ].map(([k, v]) => (
            <div key={String(k)} className="dc-stat">
              <span className="dc-stat-v">{blank ? ' ' : (String(v) || '—')}</span>
              <span className="dc-stat-k">{String(k)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDesc = (slice: { kind: string; it: Row }[]) => (
    <section className="dc-sec">
      <h2 className="dc-h2">मालमत्तेचे वर्णन</h2>
      <div className="dc-tablewrap">
        <table className="dc-table">
          {/* text columns (प्रकार/वर्णन/वापर/मजला) रुंद => 'मनोरा (टॉवर) खाली जागा' सारखा लांब
              मजकूर 3 ओळींत wrap होऊन row उंच होत नाही (पुढच्या पानावर जात नाही) */}
          <colgroup>
            {[7.5, 8, 7, 13, 4.5, 5.5, 5.5, 6, 5.5, 6.5, 5, 5, 6.5, 5, 7].map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>प्रकार</th><th>वर्णन</th><th>वापर</th><th>मजला</th><th>वय</th>
              <th>क्षे. पु.प.</th><th>क्षे. उ.द.</th><th>एकूण क्षे.</th><th>मीटर</th>
              <th>वार्षिक मूल्य</th><th>घसारा</th><th>भारांक</th><th>भांडवली मूल्य</th>
              <th>आ. दर</th><th>कर आकारणी</th>
            </tr>
          </thead>
          <tbody>
            {blank ? (
              // कोरी यादी — हाताने भरण्यासाठी रिकाम्या ओळी
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`blank-${i}`} style={{ height: '26px' }}>
                  {Array.from({ length: 15 }).map((__, j) => <td key={j}>&nbsp;</td>)}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr><td colSpan={15} className="dc-empty">वर्णन उपलब्ध नाही</td></tr>
            ) : slice.map(({ kind, it }, i) => {
              const bhandvali = kind === 'जमीन' ? landBhandvali(it) : kind === 'बांधकाम' ? consBhandvali(it) : 0;
              return (
                <tr key={i}>
                  <td className="dc-kind">{kind}</td>
                  <td className="dc-l">{s(it.malmatteche_varnan_name) || s(it.malmatteche_prakar_name)}</td>
                  <td>{s(it.vapar_prakar) || (kind === 'जमीन' ? 'एकूण जागा' : '')}</td>
                  <td>{s(it.bandkam_majla_name) || s(it.manoryache_bhag_name)}</td>
                  <td>{s(it.vayoman)}</td>
                  <td>{f(it.shetrafal_purv_paschim_foot)}</td>
                  <td>{f(it.shetrafal_uttar_dakshin_foot)}</td>
                  <td>{f(it.ekun_shetrafal_choras_foot)}</td>
                  <td>{f(sqmOf(it))}</td>
                  <td>{f(it.jaminiche_varshik_mulya) || f(it.imaratiche_varshik_mulya)}</td>
                  <td>{s(it.ghasara_dar)}</td>
                  <td>{s(it.bharank)}</td>
                  <td>{bhandvali ? f(bhandvali) : ''}</td>
                  <td>{s(it.aakarani_dar)}</td>
                  <td className="dc-kar">{f(karOf(kind, it))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  // कर आकारणी + फेरफार — सर्व totals फक्त शेवटच्या पानावर (खरी रक्कम)
  const renderTaxFerfar = () => (
    <div className="dc-row2">
      <section className="dc-sec">
        <h2 className="dc-h2">कर आकारणी</h2>
        <div className="dc-tax">
          <div className="dc-chips">
            {taxChips.map((c) => (
              <div key={c.k} className="dc-chip">
                <span className="dc-chip-k">{c.k}</span>
                <span className="dc-chip-v">{blank ? ' ' : `₹ ${f(c.v) || 0}`}</span>
              </div>
            ))}
          </div>
          <div className="dc-total">
            <div className="dc-total-row"><span>एकूण इतर कर</span><b>{blank ? ' ' : `₹ ${f(ekunTaxAmt) || 0}`}</b></div>
            <div className="dc-total-row"><span>एकूण कर भरणे</span><b>{blank ? ' ' : `₹ ${f(n.ekun_kar_bharne) || 0}`}</b></div>
            <div className="dc-total-grand"><span>एकूण कर</span><b>{blank ? ' ' : `₹ ${f(grandTotal) || 0}`}</b></div>
          </div>
        </div>
      </section>
      <section className="dc-sec dc-ferfar">
        <h2 className="dc-h2">फेरफार / शेरा · अपील निकालानंतरचे बदल</h2>
        <div className="dc-note">{s(n.magahun_ghat_kiva_badal) || ' '}</div>
      </section>
    </div>
  );

  // मधल्या पानांवर — फक्त वर्णन; totals शेवटच्या पानावर असल्याची सूचना
  const renderContinued = () => (
    <div className="dc-continued">→ वर्णन पुढे चालू · सर्व कर व एकूण रक्कम शेवटच्या पानावर</div>
  );

  // टीप / स्वाक्षरी — फक्त शेवटच्या पानावर
  const renderTips = (last: boolean) => {
    if (!last) return null;
    if (isN8fam) return (
      <section className="dc-sec dc-n8tip">
        <div className="dc-tip"><b>टीप:</b> १) मोक्यावरील बांधकामानुसार कर आकारणी केली आहे. २) मालकी हक्काचा वाद असल्यास न्यायालयामार्फत सोडवावा; न्यायालयाचा निर्णय ग्रामपंचायत व अर्जदारास बंधनकारक. ३) नामांतरण फक्त कर वसुलीच्या दृष्टीने मंजूर. ४) नमुना ८ वर नाव दाखल झाले म्हणजे मालकी हक्क प्राप्त होत नाही. (पक्के = आर.सी.सी · अर्धपक्के = टीनपत्रे/सिमेंटशीट · कच्चे = माती/कौलारू)</div>
        <div className="dc-sign">सचिव / सरपंच स्वाक्षरी</div>
      </section>
    );
    if (variant === 'imlakar') return (
      <section className="dc-sec dc-n8tip">
        <div className="dc-tip"><b>टीप:</b> १) ह्या आकारणीचा अर्थ जागेवर मालकी हक्क नव्हे. २) हा नमुना ८ नाही.</div>
        <div className="dc-sign">सचिव / सरपंच स्वाक्षरी</div>
      </section>
    );
    if (variant === 'namuna8new') return (
      <section className="dc-sec dc-n8tip">
        <div className="dc-tip">
          <p>१) सदरचा उतारा मालकी हक्काचा नसून कर आकारणीचा आहे; या उताऱ्यावरून खरेदी-विक्री व्यवहार झाल्यास ग्रामपंचायत जबाबदार राहणार नाही.</p>
          <p>२) शासन परिपत्रकानुसार ग्रामीण भागातील घरांची नोंदणी पती-पत्नी यांच्या संयुक्त नावे करण्याबाबत निर्देश आहेत.</p>
          <p style={{ color: '#dc2626' }}>३) सदर वैयक्तिक असेसमेंट उतारा पाहण्याकरीता देण्यात आलेला आहे.</p>
        </div>
      </section>
    );
    return null;
  };

  const renderFoot = (p: number) => (
    <footer className="dc-foot">
      <span>{variant === 'imlakar' ? 'इमलाकर मोजमाप यादी' : variant === 'namuna8images' ? 'नमुना ८ (छायाचित्रे)' : variant === 'namuna8' ? 'नमुना ८' : variant === 'namuna8new' ? 'नमुना ८ (नियम ३२)' : variant === 'sarkari' ? 'नमुना ८ (सरकारी)' : 'मालमत्ता धारकाची यादी'} · सन {fyLabel(cy)}{blank ? ' · कोरी यादी' : ''}</span>
      <span>पान नंबर: {bv(n.anu_kramank)}{pageCount > 1 ? ` (${p + 1}/${pageCount})` : ''}</span>
    </footer>
  );

  const pages = Array.from({ length: pageCount }, (_, p) => {
    const last = p === pageCount - 1;
    const slice = blank ? [] : descRows.slice(p * perPage, (p + 1) * perPage);
    return (
      <article className="dc-card" key={`pg-${p}`}>
        {renderHeader()}
        <div className="dc-body">
          {renderOwner()}
          {renderSeemaArea()}
          {renderDesc(slice)}
          {last ? renderTaxFerfar() : renderContinued()}
          {renderTips(last)}
        </div>
        {renderFoot(p)}
      </article>
    );
  });

  return <>{pages}</>;
};

const DharkachiYadiCard = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hdrColor, setHdrColor] = useState('');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [qrUrl, setQrUrl] = useState<string | undefined>(undefined);
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats'); // report वर floating widgets लपवा
    {
      const vp = new URLSearchParams(window.location.search).get('variant');
      document.title = vp === 'namuna8' ? 'नमुना ८ — नवीन'
        : vp === 'namuna8new' ? 'नमुना ८ नियम ३२(१) — नवीन'
        : vp === 'namuna8images' ? 'नमुना ८ चित्रे — नवीन'
        : vp === 'sarkari' ? 'सरकारी नमुना ८ — नवीन'
        : vp === 'imlakar' ? 'इमलाकर मोजमाप यादी — नवीन'
        : 'मालमत्ता धारकाची यादी — नवीन';
    }

    // 1) opener कडून थेट data (fastest, no refetch)
    try {
      const raw = sessionStorage.getItem('dharkachiYadiCardData');
      const meta = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}');
      if (meta.year && !isNaN(Number(meta.year))) setReportYear(Number(meta.year));
      if (meta.loc) setLoc(meta.loc);
      if (meta.qrUrl) setQrUrl(meta.qrUrl);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) { setRecords(parsed); setLoading(false); return; }
      }
    } catch { /* fall through to fetch */ }

    // 2) fallback — public share किंवा params वरून fetch
    let params: { ward?: string; start?: string; end?: string; type?: string; year?: string } = {};
    try { params = JSON.parse(sessionStorage.getItem('dharkachiYadiParams') || '{}'); } catch { params = {}; }
    if (params.year && !isNaN(Number(params.year))) setReportYear(Number(params.year));
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setLoc({
        district: u.district || u.district_name || u.jilha || '',
        taluka: u.taluka || u.taluka_name || u.tahsil || '',
        gramPanchayat: u.gram_panchayat || u.gramPanchayat || u.gram_panchayat_name || '',
      });
    } catch { /* ignore */ }
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, params.type, params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load dharkachi yadi (card)', e);
      } finally { setLoading(false); }
    })();
  }, []);

  // orientation URL वरून — ?orient=landscape (default portrait/vertical)
  const orient: 'portrait' | 'landscape' =
    new URLSearchParams(window.location.search).get('orient') === 'landscape' ? 'landscape' : 'portrait';
  const vParam = new URLSearchParams(window.location.search).get('variant');
  const variant: Variant = vParam === 'namuna8' ? 'namuna8'
    : vParam === 'namuna8new' ? 'namuna8new'
    : vParam === 'namuna8images' ? 'namuna8images'
    : vParam === 'sarkari' ? 'sarkari'
    : vParam === 'imlakar' ? 'imlakar'
    : 'dharkachi';

  // FIXED print size — zoom नेहमी 1 (rows वाढल्या तरी font shrink होत नाही, print नेहमी proper
  // व एकसमान). fonts असे ठेवले आहेत की ठरलेल्या rows (portrait 10 / landscape 7) + sections
  // एका पानात बसतात. card रुंदी = printW => पान पूर्ण रुंदीत भरते.
  useEffect(() => {
    if (!records.length) return;
    const isLand = orient === 'landscape';
    const printW = isLand ? 1059 : 688;     // landscape: 297mm − 45px(left) − 18px(right); portrait: 210-20-8mm
    document.documentElement.style.setProperty('--pz', '1');
    document.documentElement.style.setProperty('--cw', `${printW - 4}px`); // 4px safety => QR/उजवा edge cut नाही
    return () => {
      document.documentElement.style.removeProperty('--pz');
      document.documentElement.style.removeProperty('--cw');
    };
  }, [records, orient]);

  return (
    <div className={`dc-report${orient === 'landscape' ? ' dc-land' : ''}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{DC_CSS}</style>
      <style>{DC_PRINT[orient]}</style>
      {!isPublicReportMode() && (
        <div className="dc-toolbar no-print">
          <button onClick={() => window.print()} className="dc-print-btn">🖨️ Print / Save as PDF</button>
          <span className="dc-orient-tag">{orient === 'landscape' ? '🖥️ Landscape' : '📄 Vertical'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
        </div>
      )}
      {records.length === 0 ? (
        <p className="dc-loading">{loading ? 'लोड होत आहे…' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
      ) : (
        <>
          {records.map((n, i) => <RecordCard key={i} n={n} loc={loc} cy={reportYear} qrUrl={qrUrl} variant={variant} orient={orient} />)}
          {/* शेवटी एक कोरी (blank) यादी — जिल्हा/तालुका/ग्रा.पं. dynamic, बाकी हाताने भरण्यासाठी रिकामी */}
          <RecordCard key="blank" n={{}} loc={loc} cy={reportYear} blank variant={variant} orient={orient} />
        </>
      )}
    </div>
  );
};

const DC_CSS = `
  :root {
    --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0;
    --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; --emeraldbg:#ecfdf5;
  }
  html, body { background:#f1f5f9 !important; }
  .dc-report { min-height:100vh; padding:28px 16px 56px; font-family:'Inter','Noto Sans',system-ui,-apple-system,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .dc-toolbar { max-width:820px; margin:0 auto 20px; }
  .dc-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); transition:.15s; }
  .dc-print-btn:hover { background:#3730a3; transform:translateY(-1px); }
  .dc-loading { text-align:center; color:var(--muted); padding:64px 0; }

  .dc-card { max-width:820px; margin:0 auto 26px; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }

  .dc-head { position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:84px; padding:10px 20px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .dc-head-main { text-align:center; padding:0 92px; display:flex; flex-direction:column; align-items:center; }
  .dc-head-main h1 { margin:0; font-size:18px; font-weight:800; letter-spacing:.2px; }
  .dc-sub { margin:1px 0 0; font-size:12px; opacity:.9; }
  .dc-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 14px; margin:4px 0 0; font-size:13px; opacity:.95; }
  .dc-loc b { font-weight:700; }
  .dc-qr { position:absolute; top:11px; right:14px; background:#fff; padding:3px; border-radius:7px; line-height:0; }
  .dc-badges { position:absolute; top:11px; left:14px; display:flex; flex-direction:column; gap:4px; }
  .dc-badge { display:flex; flex-direction:column; align-items:flex-start; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.25); border-radius:7px; padding:2px 8px; min-width:64px; line-height:1.15; }
  .dc-badge i { font-style:normal; font-size:8px; text-transform:uppercase; letter-spacing:.4px; opacity:.85; }
  .dc-badge b { font-size:13px; font-weight:800; }

  .dc-body { padding:6px 22px 4px; }
  .dc-sec { padding:10px 0; }
  .dc-h2 { margin:0 0 10px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:var(--accent); display:flex; align-items:center; gap:8px; }
  .dc-h2::after { content:''; flex:1; height:1px; background:var(--line); }

  .dc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px 14px; }
  /* label व value एकाच ओळीत (label : value) — vertical space वाचतो */
  .dc-field { display:flex; align-items:baseline; gap:6px; min-width:0; }
  .dc-field.dc-wide { grid-column:span 2; }
  .dc-field .dc-label { flex-shrink:0; }
  .dc-field .dc-label::after { content:':'; }
  .dc-label { font-size:13px; color:var(--faint); font-weight:600; text-transform:uppercase; letter-spacing:.3px; }
  .dc-value { font-size:16px; color:var(--ink); font-weight:600; overflow-wrap:break-word; min-width:0; }

  .dc-seema { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .dc-seema-box { background:var(--soft); border:1px solid #e0e7ff; border-radius:10px; padding:8px 12px; display:flex; flex-direction:column; gap:2px; }

  .dc-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
  .dc-stat { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:10px 8px; text-align:center; display:flex; flex-direction:column; gap:3px; }
  .dc-stat-v { font-size:16px; font-weight:800; color:var(--ink); }
  .dc-stat-k { font-size:13px; color:var(--muted); font-weight:600; }

  .dc-tablewrap { overflow-x:auto; border:1px solid var(--line); border-radius:10px; }
  /* table-layout:fixed → table कधीही card पेक्षा रुंद होत नाही (print मध्ये scroll/clip नाही) */
  .dc-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:11px; }
  .dc-table th { background:#f1f5f9; color:var(--muted); font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.2px; padding:7px 4px; text-align:center; border-bottom:1px solid var(--line); }
  .dc-table td { padding:7px 4px; text-align:center; border-bottom:1px solid #f1f5f9; color:var(--ink); overflow-wrap:anywhere; word-break:break-word; }
  .dc-table tr:last-child td { border-bottom:none; }
  .dc-table .dc-l { text-align:left; }
  .dc-kind { font-weight:700; color:var(--accent); }
  .dc-kar { font-weight:800; color:var(--emerald); }
  .dc-empty { color:var(--faint); padding:16px 0; }

  .dc-tax { display:flex; gap:16px; flex-wrap:wrap; align-items:stretch; }
  .dc-chips { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; flex:1 1 380px; }
  .dc-chip { background:#f8fafc; border:1px solid var(--line); border-radius:9px; padding:7px 10px; display:flex; flex-direction:column; gap:2px; }
  .dc-chip-k { font-size:13px; color:var(--muted); font-weight:600; }
  .dc-chip-v { font-size:16px; font-weight:700; color:var(--ink); }
  .dc-total { flex:1 1 200px; min-width:200px; background:var(--emeraldbg); border:1px solid #a7f3d0; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; justify-content:center; }
  .dc-total-row { display:flex; justify-content:space-between; font-size:14px; color:#065f46; }
  .dc-total-row b { font-weight:700; }
  .dc-total-grand { display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:8px; border-top:1px dashed #6ee7b7; font-size:18px; color:var(--emerald); font-weight:800; }

  .dc-note { min-height:38px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:10px 12px; font-size:15px; color:#78350f; white-space:pre-wrap; }
  .dc-continued { margin:8px 0 2px; padding:8px 12px; background:var(--soft); border:1px dashed var(--accent2); border-radius:8px; font-size:12px; font-weight:600; color:var(--accent); text-align:center; }

  /* portrait (vertical) — landscape पेक्षा थोडे लहान font. :not(.dc-land) => landscape वर
     कोणताही परिणाम होत नाही (फक्त vertical मोडला लागू). */
  .dc-report:not(.dc-land) .dc-head-main h1 { font-size:16px; }
  .dc-report:not(.dc-land) .dc-sub { font-size:10.5px; }
  .dc-report:not(.dc-land) .dc-loc { font-size:11px; }
  .dc-report:not(.dc-land) .dc-h2 { font-size:11px; }
  .dc-report:not(.dc-land) .dc-label { font-size:11px; }
  .dc-report:not(.dc-land) .dc-value { font-size:14px; }
  .dc-report:not(.dc-land) .dc-seema-box .dc-value { font-size:14px; }
  .dc-report:not(.dc-land) .dc-stat-v { font-size:14px; }
  .dc-report:not(.dc-land) .dc-stat-k { font-size:11px; }
  .dc-report:not(.dc-land) .dc-table { font-size:10px; }
  .dc-report:not(.dc-land) .dc-table th { font-size:11px; }
  .dc-report:not(.dc-land) .dc-kind, .dc-report:not(.dc-land) .dc-kar { font-size:10px; }
  .dc-report:not(.dc-land) .dc-chip-k { font-size:11px; }
  .dc-report:not(.dc-land) .dc-chip-v { font-size:14px; }
  .dc-report:not(.dc-land) .dc-total-row { font-size:12px; }
  .dc-report:not(.dc-land) .dc-total-grand { font-size:15px; }
  .dc-report:not(.dc-land) .dc-note { font-size:13px; }
  /* short fields (voter id / aadhar / mobile / ward etc — non-wide) एका ओळीत => extra row
     येत नाही; wide fields (नाव/पत्ता) मात्र wrap होतात (लांब मजकूर overflow होत नाही).
     सर्व variants च्या portrait ला लागू (common fix). */
  .dc-report:not(.dc-land) .dc-grid .dc-field:not(.dc-wide) .dc-value { white-space:nowrap; }

  /* ---- portrait (vertical) — compact करून एका पानात बसवा; landscape वर परिणाम नाही (:not(.dc-land)) ---- */
  /* owner grid: dense => orphan नाही; घट्ट अंतर */
  .dc-report:not(.dc-land) .dc-grid { grid-auto-flow:row dense; gap:3px 14px; }
  /* sections घट्ट => 8 rows + सर्व sections एका पानात */
  .dc-report:not(.dc-land) .dc-body { padding-top:2px; padding-bottom:2px; }
  .dc-report:not(.dc-land) .dc-sec { padding:3px 0; }
  .dc-report:not(.dc-land) .dc-h2 { margin-bottom:3px; }
  .dc-report:not(.dc-land) .dc-head { min-height:64px; padding:6px 20px; }
  .dc-report:not(.dc-land) .dc-seema { gap:5px; }
  .dc-report:not(.dc-land) .dc-seema-box { padding:4px 8px; }
  .dc-report:not(.dc-land) .dc-stats { gap:5px; }
  .dc-report:not(.dc-land) .dc-stat { padding:4px 5px; }
  .dc-report:not(.dc-land) .dc-chips { gap:5px; }
  .dc-report:not(.dc-land) .dc-chip { padding:4px 8px; }
  .dc-report:not(.dc-land) .dc-total { padding:6px 10px; gap:3px; }
  .dc-report:not(.dc-land) .dc-note { min-height:22px; padding:5px 10px; }
  .dc-report:not(.dc-land) .dc-tip { font-size:8px; line-height:1.25; }
  .dc-report:not(.dc-land) .dc-foot { padding:6px 20px; }
  /* description table headers नीट wrap + घट्ट rows */
  .dc-report:not(.dc-land) .dc-table th { white-space:normal; word-break:keep-all; line-height:1.15; padding:3px 4px; }
  .dc-report:not(.dc-land) .dc-table td { line-height:1.15; padding:3px 4px; }

  .dc-foot { display:flex; justify-content:space-between; padding:12px 22px; background:#f8fafc; border-top:1px solid var(--line); font-size:11px; color:var(--muted); }

  /* नमुना ८ — टीप + स्वाक्षरी */
  .dc-tip { font-size:9.5px; line-height:1.4; color:var(--muted); }
  .dc-tip b { color:var(--ink); }
  .dc-tip p { margin:0 0 3px; }

  /* नमुना ८ चित्रे — मालमत्तेचे छायाचित्र (owner section च्या उजवीकडे) */
  .dc-owner-wrap { display:flex; gap:16px; align-items:flex-start; }
  .dc-owner-wrap .dc-grid { flex:1; min-width:0; }
  /* box image ला exactly wrap करतो (fixed height, width image-नुसार) → letterbox gap नाही */
  .dc-photo { height:145px; max-width:280px; flex-shrink:0; border:1px solid var(--line); border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#fff; }
  .dc-photo img { height:100%; width:auto; display:block; }
  .dc-photo-ph { width:190px; height:100%; display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--faint); }
  /* photo असताना owner grid कमी columns (रुंद cells → wrap नाही) */
  .dc-has-photo .dc-grid { grid-template-columns:repeat(3,1fr); }
  .dc-land .dc-has-photo .dc-grid { grid-template-columns:repeat(4,1fr); }
  .dc-sign { margin-top:16px; text-align:right; font-weight:700; font-size:12px; color:var(--ink); }
  .dc-land .dc-tip { font-size:8px; line-height:1.25; }
  .dc-land .dc-sign { margin-top:6px; }

  /* mobile — layout print सारखाच ठेवा, फक्त दोन्ही बाजूंनी scroll द्या (बघायचे असल्यास).
     अरुंद screen वर card cram होत नाही; horizontal + vertical scroll ने पूर्ण report बघता येते. */
  @media screen and (max-width:860px){
    .dc-report{ overflow-x:auto; -webkit-overflow-scrolling:touch; padding:16px 12px 44px; }
    .dc-toolbar{ position:sticky; left:0; width:max-content; }
    .dc-card{ min-width:700px; }
    .dc-land .dc-card{ min-width:1040px; }
  }

  /* dc-row2: portrait मध्ये invisible (sections normally flow); landscape मध्ये 2-column
     (रुंद format वापरून height कमी → एका पानात मोठ्या fonts सह बसते) */
  .dc-row2 { display:contents; }
  .dc-land .dc-row2 { display:grid; grid-template-columns:1fr 1fr; gap:0 22px; align-items:start; }

  /* landscape — रुंद format, मोठे readable fonts (~15px), print proper */
  .dc-land .dc-card { max-width:1120px; }
  .dc-land .dc-head-main h1 { font-size:22px; }
  .dc-land .dc-sub { font-size:12px; }
  .dc-land .dc-loc { font-size:13px; }
  .dc-land .dc-h2 { font-size:13px; }
  .dc-land .dc-label { font-size:13px; }
  .dc-land .dc-value { font-size:16px; }
  .dc-land .dc-seema-box .dc-label { font-size:13px; }
  .dc-land .dc-seema-box .dc-value { font-size:16px; }
  .dc-land .dc-stat-v { font-size:20px; }
  .dc-land .dc-stat-k { font-size:12px; }
  .dc-land .dc-table th { font-size:12px; }
  .dc-land .dc-table td { font-size:14px; }
  .dc-land .dc-kind, .dc-land .dc-kar { font-size:14px; }
  .dc-land .dc-chip-k { font-size:13px; }
  .dc-land .dc-chip-v { font-size:16px; }
  .dc-land .dc-total-row { font-size:14px; }
  .dc-land .dc-total-grand { font-size:18px; }
  .dc-land .dc-note { font-size:15px; }

  /* landscape COMPACT — tiles/boxes/chips ला inline ओळींमध्ये बदलून height कमी;
     त्यामुळे 14-15px fonts एका पानात नीट बसतात (barik न होता). */
  .dc-land .dc-sec { padding:2px 0; }
  .dc-land .dc-h2 { margin-bottom:2px; }
  .dc-land .dc-head { min-height:42px; padding:4px 18px; }
  .dc-land .dc-note { min-height:20px; }
  .dc-land .dc-head-main h1 { font-size:18px; }
  .dc-land .dc-sub { font-size:12px; margin:0; }
  .dc-land .dc-loc { margin-top:2px; }
  /* owner — 5 columns; dense => wide fields मुळे orphan row येत नाही */
  .dc-land .dc-grid { grid-template-columns:repeat(5,1fr); gap:3px 16px; grid-auto-flow:row dense; }
  /* owner values एका ओळीत (voter id / aadhar / mobile wrap होऊ नये) */
  .dc-land .dc-grid .dc-value { white-space:nowrap; }
  /* चतु:सीमा — inline */
  .dc-land .dc-seema { display:flex; flex-wrap:wrap; gap:3px 26px; }
  .dc-land .dc-seema-box { flex-direction:row; align-items:baseline; gap:6px; background:none; border:none; padding:0; border-radius:0; }
  .dc-land .dc-seema-box .dc-label::after { content:':'; }
  /* क्षेत्रफळ — inline (tile नको) */
  .dc-land .dc-stats { display:flex; flex-wrap:wrap; gap:3px 26px; }
  .dc-land .dc-stat { flex-direction:row-reverse; justify-content:flex-end; align-items:baseline; gap:6px; background:none; border:none; padding:0; border-radius:0; }
  .dc-land .dc-stat-k::after { content:':'; }
  .dc-land .dc-stat-v { font-size:16px; }
  .dc-land .dc-stat-k { font-size:13px; color:var(--faint); }
  /* कर आकारणी — inline strip (chip cards नको) */
  .dc-land .dc-tax { display:flex; flex-wrap:wrap; align-items:center; gap:4px 20px; }
  .dc-land .dc-chips { display:flex; flex-wrap:wrap; gap:3px 20px; }
  .dc-land .dc-chip { flex-direction:row; align-items:baseline; gap:6px; background:none; border:none; padding:0; border-radius:0; }
  .dc-land .dc-chip-k::after { content:':'; }
  .dc-land .dc-total { flex-direction:row; flex-wrap:wrap; align-items:center; gap:4px 18px; background:none; border:none; padding:0; }
  .dc-land .dc-total-grand { border:none; padding:0; margin:0; }
  /* description table — tight single-line rows (कमी height) */
  .dc-land .dc-table th { padding:2px 5px; font-size:13px; white-space:normal; word-break:keep-all; line-height:1.2; }
  .dc-land .dc-table td { padding:2px 5px; font-size:11px; line-height:1.15; }
  .dc-land .dc-table .dc-l { white-space:normal; }
  .dc-land .dc-kind, .dc-land .dc-kar { font-size:11px; }

  /* common print rules (orientation-independent). @page + card zoom orientation-specific
     DC_PRINT मध्ये (portrait / landscape). एक record = एक पान. */
  @media print {
    html, body { background:#fff !important; }
    .no-print { display:none !important; }
    .dc-report { padding:0; }
    .dc-card { box-shadow:none; border:1px solid #cbd5e1; margin:0 auto; page-break-after:always; break-after:page; page-break-inside:avoid; break-inside:avoid; }
    .dc-card:last-child { page-break-after:auto; break-after:auto; }
    .dc-tablewrap { overflow:visible !important; }
    .dc-head { min-height:82px; padding:9px 20px; }
    .dc-sec { padding:8px 0; }
    .dc-h2 { margin-bottom:6px; }
    .dc-grid { gap:6px 14px; }
    .dc-seema, .dc-stats { gap:7px; }
    .dc-stat { padding:7px 6px; }
    .dc-chip { padding:6px 9px; }
    .dc-note { min-height:26px; }
    .dc-foot { padding:8px 20px; }
    .dc-table th, .dc-table td { padding:5px 5px; }
  }
  .dc-orient-tag { align-self:center; font-size:13px; font-weight:600; color:var(--muted); }
`;

/* orientation-specific print: @page size + margins (binding: जास्त top+left) + card zoom
   जेणेकरून पूर्ण card एका पानात बसतो. Vertical=portrait, Landscape=landscape. */
/* zoom (--pz) JS ने auto-fit केला जातो (सर्वात उंच card एका पानात बसेल असा) व सर्व cards ला
   एकच लावला जातो — म्हणजे प्रत्येक report सारख्याच आकाराचा. binding: जास्त top+left margin. */
const DC_PRINT: Record<'portrait' | 'landscape', string> = {
  portrait: `@media print {
    @page { size:A4 portrait; margin:18mm 8mm 12mm 20mm; }
    .dc-card { zoom:var(--pz,0.9); max-width:100%; }
  }`,
  landscape: `@media print {
    @page { size:A4 landscape; margin:17mm 18px 8mm 45px; }
    .dc-card { zoom:var(--pz,0.85); width:var(--cw,100%) !important; max-width:none !important; }
  }`,
};

export default DharkachiYadiCard;
