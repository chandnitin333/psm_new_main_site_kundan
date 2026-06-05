export interface VasuliFormData {
  year: string;
  toYear: string;
  anuKramank: string;
  malmattaKramank: string;
  wardKramank: string;
  plotKramank: string;
  khasaraKramank: string;
  surveyKramank: string;
  khatedaracheNav: string;
  bhogwatdaracheNav: string;
}

export interface VasuliRecord {
  id?: number;
  anuKramank: string;
  milkatKramank: string;
  wardNo: string;
  khasaraKramank: string;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
  year: string;
  // Additional fields from form
  vasuliNaumaYad?: string;
  gramPanchayat?: string;
  plotNo?: string;
  surveyKramank?: string;
  masikSabhaKramank?: string;
  tharavKramank?: string;
  dinak?: string;
  sachiv?: string;
  sarpanch?: string;
  upsarpanch?: string;
  sheraTip?: string;
}
