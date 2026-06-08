import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import reportShareService from '../../services/reportShareService';
import { PUBLIC_DATA_KEY } from '../../utils/publicReport';

// Report components rendered for a scanned QR. Add new report types here.
import Bill129_1Report from '../dashboard/ahval/Bill129_1Report';
import Bill129_2Report from '../dashboard/ahval/Bill129_2Report';
import Namuna8MultiReport from '../dashboard/ahval/Namuna8MultiReport';
import Namuna8SarkariMultiReport from '../dashboard/ahval/Namuna8SarkariMultiReport';
import Namuna8NewMultiReport from '../dashboard/ahval/Namuna8NewMultiReport';
import Namuna8ImagesMultiReport from '../dashboard/ahval/Namuna8ImagesMultiReport';
import Namuna9MultiReport from '../dashboard/ahval/Namuna9MultiReport';
import Namuna9NewMultiReport from '../dashboard/ahval/Namuna9NewMultiReport';
import MalmattaDharkachiReport from '../dashboard/ahval/MalmattaDharkachiReport';
import ImlaKarReport from '../dashboard/ahval/ImlaKarReport';
import Namuna8AnukramikaReport from '../dashboard/ahval/Namuna8AnukramikaReport';
import Namuna8GhosvaraReport from '../dashboard/ahval/Namuna8GhosvaraReport';
import Namuna9AnukramikaReport from '../dashboard/ahval/Namuna9AnukramikaReport';
import Namuna9GhosvaraReport from '../dashboard/ahval/Namuna9GhosvaraReport';
import ImlaKarAnukramikaReport from '../dashboard/ahval/ImlaKarAnukramikaReport';
import AadharReport from '../dashboard/ahval/AadharReport';
import MobileReport from '../dashboard/ahval/MobileReport';
import PaniReport from '../dashboard/ahval/PaniReport';
import ShouchalayReport from '../dashboard/ahval/ShouchalayReport';
import Namuna8Print from '../dashboard/malmatta-nodni/Namuna8Print';
import Namuna8SarkariPrint from '../dashboard/malmatta-nodni/Namuna8SarkariPrint';
import Namuna8NewPrint from '../dashboard/malmatta-nodni/Namuna8NewPrint';
import Namuna8ImagesPrint from '../dashboard/malmatta-nodni/Namuna8ImagesPrint';
import Namuna9Print from '../dashboard/malmatta-nodni/Namuna9Print';

const REGISTRY: Record<string, React.ComponentType> = {
  'bill-129-1': Bill129_1Report,
  'bill-129-2': Bill129_2Report,
  'namuna8': Namuna8MultiReport,
  'namuna8-sarkari': Namuna8SarkariMultiReport,
  'namuna8-new': Namuna8NewMultiReport,
  'namuna8-images': Namuna8ImagesMultiReport,
  'namuna9': Namuna9MultiReport,
  'namuna9-new': Namuna9NewMultiReport,
  'dharkachi': MalmattaDharkachiReport,
  'imlakar': ImlaKarReport,
  'namuna8-anukramika': Namuna8AnukramikaReport,
  'namuna8-ghosvara': Namuna8GhosvaraReport,
  'namuna9-anukramika': Namuna9AnukramikaReport,
  'namuna9-ghosvara': Namuna9GhosvaraReport,
  'imlakar-anukramika': ImlaKarAnukramikaReport,
  'aadhar': AadharReport,
  'mobile': MobileReport,
  'pani': PaniReport,
  'shouchalay': ShouchalayReport,
  'namuna8-single': Namuna8Print,
  'namuna8-sarkari-single': Namuna8SarkariPrint,
  'namuna8-new-single': Namuna8NewPrint,
  'namuna8-images-single': Namuna8ImagesPrint,
  'namuna9-single': Namuna9Print,
};

const PublicReportViewer = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ReportComp, setReportComp] = useState<React.ComponentType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) { setStatus('error'); setErrorMsg('अवैध लिंक'); return; }
      try {
        const res = await reportShareService.getPublic(token);
        if (!active) return;
        if (!res?.success || !res.data) {
          setStatus('error'); setErrorMsg(res?.message || 'अहवाल सापडला नाही');
          return;
        }
        const { report_type, params, data } = res.data;
        const Comp = REGISTRY[report_type];
        if (!Comp) { setStatus('error'); setErrorMsg('हा अहवाल प्रकार उपलब्ध नाही'); return; }

        const p = (params || {}) as Record<string, unknown>;
        // Restore the context the report expects
        if (p.__user) {
          try { localStorage.setItem('user', JSON.stringify(p.__user)); } catch { /* ignore */ }
        }
        const sessionKey = p.__sessionKey as string | undefined;
        if (sessionKey) {
          const clean = { ...p };
          delete clean.__user;
          delete clean.__sessionKey;
          sessionStorage.setItem(sessionKey, JSON.stringify(clean));
        }
        sessionStorage.setItem(PUBLIC_DATA_KEY, JSON.stringify(data ?? []));

        setReportComp(() => Comp);
        setStatus('ready');
      } catch {
        if (active) { setStatus('error'); setErrorMsg('अहवाल लोड करण्यात अयशस्वी'); }
      }
    })();
    return () => {
      active = false;
      // leave PUBLIC_DATA_KEY so the rendered report can read it; cleared on next public open
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #764ba2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (status === 'error' || !ReportComp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#333', textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 40 }}>📄</div>
        <p style={{ fontWeight: 600 }}>{errorMsg || 'अहवाल उपलब्ध नाही'}</p>
      </div>
    );
  }

  return <ReportComp />;
};

export default PublicReportViewer;
