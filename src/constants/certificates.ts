/**
 * Gram Panchayat certificates / documents.
 *
 * Only certificates a Gram Panchayat actually issues (or issues with a
 * verification/recommendation role) are listed. Revenue-department documents
 * (Caste, Income, Domicile, Non-Creamy-Layer, 7/12 extract) are intentionally
 * excluded — GP only provides supporting verification for those.
 *
 * `built: true` means a dedicated certificate page exists; others show a
 * "coming soon" placeholder until their (own-format) page is added.
 */

export type CertCategory = 'issued' | 'verify';

export interface CertificateDef {
  slug: string;
  no: number;
  name: string;        // English
  marathi: string;     // Marathi name
  purpose: string;
  category: CertCategory; // 'issued' = GP issues directly, 'verify' = GP verifies/recommends
  built?: boolean;
}

export const CERTIFICATES: CertificateDef[] = [
  { no: 1, slug: 'birth', name: 'Birth Certificate', marathi: 'जन्म प्रमाणपत्र', purpose: 'जन्माचा पुरावा, शाळा प्रवेश, पासपोर्ट, शासकीय कामे', category: 'issued', built: true },
  { no: 2, slug: 'death', name: 'Death Certificate', marathi: 'मृत्यू प्रमाणपत्र', purpose: 'मृत्यूचा कायदेशीर पुरावा, वारसा, पेन्शन, विमा', category: 'issued', built: true },
  { no: 3, slug: 'marriage', name: 'Marriage Registration Certificate', marathi: 'विवाह नोंदणी प्रमाणपत्र', purpose: 'विवाहाचा कायदेशीर पुरावा', category: 'issued', built: true },
  { no: 4, slug: 'residence', name: 'Residence Certificate', marathi: 'रहिवासी प्रमाणपत्र', purpose: 'व्यक्ती गावातील रहिवासी असल्याचा पुरावा', category: 'issued', built: true },
  { no: 5, slug: 'bpl', name: 'Below Poverty Line (BPL) Certificate', marathi: 'दारिद्र्य रेषेखालील प्रमाणपत्र', purpose: 'शासकीय योजना व लाभ', category: 'verify', built: true },
  { no: 6, slug: 'destitute', name: 'Destitute Certificate', marathi: 'निराधार प्रमाणपत्र', purpose: 'निराधार पेन्शन योजना', category: 'verify', built: true },
  { no: 7, slug: 'life', name: 'Life Certificate', marathi: 'हयात प्रमाणपत्र', purpose: 'पेन्शन व शासकीय लाभ', category: 'issued', built: true },
  { no: 8, slug: 'age', name: 'Age Certificate', marathi: 'वय प्रमाणपत्र', purpose: 'ज्येष्ठ नागरिक / निराधार योजना', category: 'verify', built: true },
  { no: 9, slug: 'character', name: 'Character Certificate', marathi: 'चारित्र्य प्रमाणपत्र', purpose: 'स्थानिक चारित्र्य पडताळणी', category: 'issued', built: true },
  { no: 10, slug: 'no-dues', name: 'No Dues Certificate', marathi: 'थकबाकी नसल्याचा दाखला', purpose: 'ग्रामपंचायत थकबाकी नसल्याची खात्री', category: 'issued', built: true },
  { no: 11, slug: 'property-assessment', name: 'Property Assessment Certificate', marathi: 'मालमत्ता कर आकारणी प्रमाणपत्र', purpose: 'घर/मालमत्ता नोंदी', category: 'issued', built: true },
  { no: 12, slug: 'form8-extract', name: 'Form 8 Extract', marathi: 'नमुना ८ उतारा', purpose: 'मालमत्ता मालकी / कर तपशील', category: 'issued', built: true },
  { no: 13, slug: 'property-transfer', name: 'Property Transfer Certificate', marathi: 'मालमत्ता हस्तांतरण प्रमाणपत्र', purpose: 'मालमत्ता मालकी बदल नोंद', category: 'issued', built: true },
  { no: 14, slug: 'construction-permission', name: 'Construction Permission Certificate', marathi: 'बांधकाम परवानगी प्रमाणपत्र', purpose: 'घर बांधकाम परवानगी', category: 'issued', built: true },
  { no: 15, slug: 'toilet', name: 'Toilet Certificate', marathi: 'शौचालय प्रमाणपत्र', purpose: 'स्वच्छता योजना', category: 'issued', built: true },
  { no: 16, slug: 'noc', name: 'No Objection Certificate (NOC)', marathi: 'ना हरकत प्रमाणपत्र', purpose: 'वीज जोडणी, व्यवसाय, नोकरी इ.', category: 'issued', built: true },
  { no: 17, slug: 'pipe-connection', name: 'Pipe Connection Permission', marathi: 'नळ जोडणी परवानगी', purpose: 'पाणी जोडणी मंजुरी', category: 'issued', built: true },
  { no: 18, slug: 'unemployment', name: 'Unemployment Certificate', marathi: 'बेरोजगारी प्रमाणपत्र', purpose: 'रोजगारविषयक योजना', category: 'verify', built: true },
  { no: 19, slug: 'business-noc', name: 'Business / Employment NOC', marathi: 'व्यवसाय/नोकरीसाठी ना हरकत', purpose: 'व्यवसायासाठी स्थानिक मंजुरी', category: 'issued', built: true },
  { no: 20, slug: 'gp-pending', name: 'Gram Panchayat Pending Certificate', marathi: 'ग्रामपंचायत थकबाकी दाखला', purpose: 'थकबाकी स्थिती दर्शवते', category: 'issued', built: true },
];

export const getCertificate = (slug?: string): CertificateDef | undefined =>
  CERTIFICATES.find((c) => c.slug === slug);
