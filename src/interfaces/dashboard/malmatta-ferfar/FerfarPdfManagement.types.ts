export interface FerfarPdfFormData {
  fileName: string;
  pdfFile: File | null;
}

export interface FerfarPdfRecord {
  jilha: string;
  taluka: string;
  gramPanchayat: string;
  fileName: string;
  pdfUrl: string;
}
