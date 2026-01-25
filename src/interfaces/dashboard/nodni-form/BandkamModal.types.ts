export interface BandkamData {
  malmattechePrakar: string;
  malmattecheVarnan: string;
  vaparPrakar: string;
  bandkamMajla: string;
  shetrafalPurvPachimFoot: string;
  shetrafalUttarDakshinFoot: string;
  shetrafalPurvPachimMeter: string;
  shetrafalUttarDakshinMeter: string;
  vayoman: string;
  imaraticheBandkamVarsh: string;
  ghasaraDar: string;
  bharank: string;
  imaraticheVarshikMulya: string;
  aakraniDar: string;
}

export interface BandkamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BandkamData) => void;
  initialData?: BandkamData;
}
