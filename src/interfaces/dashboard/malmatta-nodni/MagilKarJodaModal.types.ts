export interface MagilKarJodaData {
  year: string;
  toYear: string;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
  gruhkarVBhumikar: string;
  vijDivabattiKar: string;
  aarogyaRakshanKar: string;
  safaeKar: string;
  samanyaPaniKar: string;
  visheshPaniKar: string;
  iterFees: string;
  noticeFees: string;
  sutPercent: string;
  vadPercent: string;
  ekun: string;
}

export interface MagilKarJodaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MagilKarJodaData) => void;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
}
