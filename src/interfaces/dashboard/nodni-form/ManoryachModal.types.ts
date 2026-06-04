export interface ManoryachData {
  malmattechePrakar: string;
  malmattechePrakarName?: string;
  malmattecheVarnan: string;
  malmattecheVarnanName?: string;
  vaparPrakar: string;
  manorycheBhag: string;
  manorycheBhagName?: string;
  shetrafalPurvPachimFoot: string;
  shetrafalUttarDakshinFoot: string;
  ekunShetrafalChorasFoot: string;
  shetrafalPurvPachimMeter: string;
  shetrafalUttarDakshinMeter: string;
  aakraniDar: string;
  majla: string;
}

export interface ManoryachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ManoryachData) => void;
  initialData?: ManoryachData;
}
