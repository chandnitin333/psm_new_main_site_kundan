export interface ManoryachData {
  malmattechePrakar: string;
  malmattecheVarnan: string;
  vaparPrakar: string;
  manorycheBhag: string;
  shetrafalPurvPachimFoot: string;
  shetrafalUttarDakshinFoot: string;
  shetrafalPurvPachimMeter: string;
  shetrafalUttarDakshinMeter: string;
  aakraniDar: string;
}

export interface ManoryachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ManoryachData) => void;
  initialData?: ManoryachData;
}
