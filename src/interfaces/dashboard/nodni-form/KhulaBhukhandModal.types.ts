export interface KhulaBhukhandData {
  malmattechePrakar: string;
  malmattechePrakarName?: string;
  malmattecheVarnan: string;
  malmattecheVarnanName?: string;
  vaparPrakar: string;
  gavacheNav: string;
  gavacheNavName?: string;
  gavthanBaher: string;
  gavthanBaherName?: string;
  shetrafalPurabPachimMeter: string;
  shetrafalUttarDakshinFoot: string;
  ekunShetrafalChorasFoot: string;
  shetrafalPurabPachimMeter2: string;
  shetrafalUttarDakshinMeter: string;
  jaminicheVarshikMulya: string;
  aakraniDar: string;
}

export interface KhulaBhukhandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: KhulaBhukhandData) => void;
  initialData?: KhulaBhukhandData;
}
