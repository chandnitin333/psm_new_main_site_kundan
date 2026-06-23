import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft } from 'lucide-react';
import { getCertificate } from '../../../constants/certificates';
import ResidenceCertificate from './ResidenceCertificate';
import BirthCertificate from './BirthCertificate';
import DeathCertificate from './DeathCertificate';
import MarriageCertificate from './MarriageCertificate';
import BPLCertificate from './BPLCertificate';
import DestituteCertificate from './DestituteCertificate';
import LifeCertificate from './LifeCertificate';
import AgeCertificate from './AgeCertificate';
import CharacterCertificate from './CharacterCertificate';
import NoDuesCertificate from './NoDuesCertificate';
import ToiletCertificate from './ToiletCertificate';
import NOCCertificate from './NOCCertificate';
import PropertyAssessmentCertificate from './PropertyAssessmentCertificate';
import Form8ExtractCertificate from './Form8ExtractCertificate';
import PropertyTransferCertificate from './PropertyTransferCertificate';
import GPPendingCertificate from './GPPendingCertificate';
import ConstructionPermissionCertificate from './ConstructionPermissionCertificate';
import PipeConnectionCertificate from './PipeConnectionCertificate';
import UnemploymentCertificate from './UnemploymentCertificate';
import BusinessNOCCertificate from './BusinessNOCCertificate';

/* Routes /certificates/:slug to the right certificate component.
   Each certificate has its OWN format; built ones render here, the rest show a
   placeholder until their page is added. */
const REGISTRY: Record<string, React.ComponentType> = {
  residence: ResidenceCertificate,
  birth: BirthCertificate,
  death: DeathCertificate,
  marriage: MarriageCertificate,
  bpl: BPLCertificate,
  destitute: DestituteCertificate,
  life: LifeCertificate,
  age: AgeCertificate,
  character: CharacterCertificate,
  'no-dues': NoDuesCertificate,
  toilet: ToiletCertificate,
  noc: NOCCertificate,
  'property-assessment': PropertyAssessmentCertificate,
  'form8-extract': Form8ExtractCertificate,
  'property-transfer': PropertyTransferCertificate,
  'gp-pending': GPPendingCertificate,
  'construction-permission': ConstructionPermissionCertificate,
  'pipe-connection': PipeConnectionCertificate,
  unemployment: UnemploymentCertificate,
  'business-noc': BusinessNOCCertificate,
};

const CertificatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cert = getCertificate(slug);
  const Cmp = slug ? REGISTRY[slug] : undefined;

  // always open a certificate scrolled to the top
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (cert && Cmp) return <Cmp />;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/certificates')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> सर्व प्रमाणपत्रे
      </button>
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40">
          <Award className="h-7 w-7" />
        </span>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{cert?.marathi || 'प्रमाणपत्र'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{cert?.name}</p>
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          हे प्रमाणपत्र लवकरच उपलब्ध होईल.
        </p>
      </div>
    </div>
  );
};

export default CertificatePage;
