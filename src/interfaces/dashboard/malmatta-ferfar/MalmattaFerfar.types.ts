export interface MalmattaFerfarFormData {
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

export interface MalmattaFerfarRecord {
  anuKramank: string;
  milkatKramank: string;
  wardNo: string;
  khasaraKramank: string;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
  year: string;
  // Additional fields from form
  ferfarNaumaYad?: string;
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
