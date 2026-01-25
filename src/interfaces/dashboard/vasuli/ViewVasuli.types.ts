export interface ViewVasuliData {
  // Header Information
  gramPanchayat: string;
  tahsil: string;
  jilha: string;
  pavtiKramank: string;

  // Table 1 - 6 columns
  anuKramank: string;
  malmattaKramank: string;
  wardKramank: string;
  plotKramank: string;
  khasaraKramank: string;
  surveyKramank: string;

  // Table 2 - Personal Details
  khatedarkacheNav: string;
  patniMulacheNav: string;
  bhogwatdaracheNav: string;
  gruhkarVBhumikarDinank: string;
  paniKarDinank: string;

  // Middle Text
  shera: string;

  // Table 3 - Financial Details
  gruhkarVBhumikar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  divabattiVizKar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  aarogyaRakshanKar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  safaeKar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  samanyaPaniKar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  visheshPaniKar: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };
  ekunRakkam: {
    magilBaki: string;
    chaluKar: string;
    ekunJamaRakkam: string;
    thakbakiRakkam: string;
  };

  // Footer
  bharleliRakkamAkshari: string;
}
