/** Display shape used by the table component */
export interface KarAakaraniRecord {
  drNo: string;
  year: string;
  toYear: string;
  wardNo: string;
  khatedarkacheNav: string;
  gruhkarVBhumikar: string;
  vizDivabattikar: string;
  aarogyaRakshanKar: string;
  safaeKar: string;
  samanyaPaniKar: string;
  visheshPaniKar: string;
  ekunMagilBaki: string;
  ekunImaratKar: string;
  ekun: string;
}

/** Raw record shape returned by /main/kar-aakarani/list */
export interface ApiKarAakaraniRecord {
  id: number;
  nodni_id: number;
  year: string;
  to_year: string;
  ward_number: string;
  anu_kramank: string;
  malmatta_number: string;
  khatedharkache_nav: string;
  bhogwatdarache_nav: string;
  patta_address: string;
  chalu_gruhkar_v_bhumikar: string | number;
  magil_gruhkar_v_bhumikar: string | number;
  sillak_gruhkar_v_bhumikar: string | number;
  chalu_viz_divabatti_kar: string | number;
  chalu_aarogya_rakshan_kar: string | number;
  chalu_safae_kar: string | number;
  chalu_samanya_pani_kar: string | number;
  chalu_vishesh_pani_kar: string | number;
  magil_ekun: string | number;
  chalu_ekun: string | number;
  jama_keleli_ekun: string | number;
  sillak_ekun: string | number;
  ekun_emarat_kar: string | number;
}

/** Ward dropdown option from /main/common-ddl/ward-list */
export interface WardListItem {
  ward_number: string;
}

/** Server-computed footer totals (sum over ALL matching records) */
export interface KarAakaraniTotals {
  ekun_khatedar: number;
  ekun_jamin_kar: number;
  ekun_viz_divabattikar: number;
  ekun_aarogya_rakshan_kar: number;
  ekun_safae_kar: number;
  ekun_samanya_pani_kar: number;
  ekun_vishesh_pani_kar: number;
  ekun_magil_baki: number;
  ekun_imarat_kar: number;
  ekun_kar: number;
}

export interface KarAakaraniPagination {
  current_page: number;
  per_page: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Full /main/kar-aakarani/list response payload */
export interface KarAakaraniListResponse {
  records: ApiKarAakaraniRecord[];
  totals: KarAakaraniTotals;
  pagination: KarAakaraniPagination;
}

/** Zeroed totals for initial / empty state */
export const EMPTY_TOTALS: KarAakaraniTotals = {
  ekun_khatedar: 0,
  ekun_jamin_kar: 0,
  ekun_viz_divabattikar: 0,
  ekun_aarogya_rakshan_kar: 0,
  ekun_safae_kar: 0,
  ekun_samanya_pani_kar: 0,
  ekun_vishesh_pani_kar: 0,
  ekun_magil_baki: 0,
  ekun_imarat_kar: 0,
  ekun_kar: 0,
};
