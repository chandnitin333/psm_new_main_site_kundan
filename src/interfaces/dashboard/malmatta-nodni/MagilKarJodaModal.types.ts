export interface MagilKarJodaData {
  year: string;
  toYear: string;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
  // Row 2: गृहकर व भूमिकर
  gruhkarVBhumikar: string;
  gruhkarSut: string;
  gruhkarVad: string;
  gruhkarEkun: string;
  // Row 3: विज/दिवाबत्ती कर
  vijDivabattiKar: string;
  vijSut: string;
  vijVad: string;
  vijEkun: string;
  // Row 4: आरोग्य रक्षण कर
  aarogyaRakshanKar: string;
  aarogyaSut: string;
  aarogyaVad: string;
  aarogyaEkun: string;
  // Row 5: सफाई कर
  safaeKar: string;
  safaeSut: string;
  safaeVad: string;
  safaeEkun: string;
  // Row 6: सामान्य पाणी कर
  samanyaPaniKar: string;
  samanyaPaniSut: string;
  samanyaPaniVad: string;
  samanyaPaniEkun: string;
  // Row 7: विशेष पाणी कर
  visheshPaniKar: string;
  visheshPaniSut: string;
  visheshPaniVad: string;
  visheshPaniEkun: string;
  // Row 8: इतर फीस, नोटीस फीस, एकूण
  iterFees: string;
  noticeFees: string;
  grandEkun: string;
}

export interface MagilKarJodaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MagilKarJodaData) => void;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
}
