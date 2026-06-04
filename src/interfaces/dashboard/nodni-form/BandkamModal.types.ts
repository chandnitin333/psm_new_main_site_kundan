export interface BandkamData {
  malmattechePrakar: string;
  malmattechePrakarName?: string;
  malmattecheVarnan: string;
  malmattecheVarnanName?: string;
  vaparPrakar: string;
  bandkamMajla: string;
  bandkamMajlaName?: string;
  shetrafalPurvPachimFoot: string;
  shetrafalUttarDakshinFoot: string;
  ekunShetrafalChorasFoot: string;
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
