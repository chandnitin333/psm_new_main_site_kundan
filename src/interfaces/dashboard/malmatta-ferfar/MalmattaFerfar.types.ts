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
  id: number;
  nodni_id?: number;
  ferfar_namuna_yadi_id?: number;
  gram_panchayat_id?: number;
  anu_kramank: string;
  malmatta_number: string;
  ward_kramnak: string;
  plot_number?: string;
  khasara_number: string;
  survey_number?: string;
  ghar_malkache_nav_lihun_denar: string;
  nav_lihun_ghenara: string;
  year: string;
  to_year?: string;
  masik_sabha_kramank?: string;
  tharav_kramnak?: string;
  dinank_date?: string;
  sachive?: string;
  sarpanch?: string;
  upsarpanch?: string;
  shera_tip?: string;
  created_at?: string;
  updated_at?: string;
}
