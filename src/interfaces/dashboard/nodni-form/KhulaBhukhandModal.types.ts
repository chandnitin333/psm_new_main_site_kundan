export interface KhulaBhukhandData {
  malmattechePrakar: string;
  malmattecheVarnan: string;
  vaparPrakar: string;
  gavacheNav: string;
  gavthanBaher: string;
  shetrafalPurabPachimMeter: string;
  shetrafalUttarDakshinFoot: string;
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
