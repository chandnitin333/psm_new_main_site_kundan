export interface VasuliFormData {
  nodniId: string;
  year: string;
  toYear: string;
  anuKramank: string;
  malmattaKramank: string;
  wardKramank: string;
  plotKramank: string;
  khasaraKramank: string;
  surveyKramank: string;
  khatedharkacheNav: string;
  bhogwatdaracheNav: string;
  patta: string;
  // bill book / pavti numbers (per payment) — गृहकर & पाणी कर
  gharBillBook: string;
  gharPavti: string;
  paniBillBook: string;
  paniPavti: string;

  // Tax rows
  gruhkarMagil: string;
  gruhkarChalu: string;
  gruhkarJama: string;
  gruhkarShillak: string;

  vizMagil: string;
  vizChalu: string;
  vizJama: string;
  vizShillak: string;

  aarogyaMagil: string;
  aarogyaChalu: string;
  aarogyaJama: string;
  aarogyaShillak: string;

  safaeMagil: string;
  safaeChalu: string;
  safaeJama: string;
  safaeShillak: string;

  gruhkarPavtiDate: string;

  samanyaPaniMagil: string;
  samanyaPaniChalu: string;
  samanyaPaniJama: string;
  samanyaPaniShillak: string;

  visheshPaniMagil: string;
  visheshPaniChalu: string;
  visheshPaniJama: string;
  visheshPaniShillak: string;

  paniPavtiDate: string;

  noticeFeeMagil: string;
  noticeFeeChalu: string;
  noticeFeeJama: string;
  noticeFeeShillak: string;

  etarFeeMagil: string;
  etarFeeChalu: string;
  etarFeeJama: string;
  etarFeeShillak: string;

  // Payment method
  paymentType: string;
  cashAmount: string;
  chequeNumber: string;
  chequeAmount: string;
  chequeDate: string;
  chequeBankName: string;
  ddNumber: string;
  ddAmount: string;
  ddDate: string;
  ddBankName: string;
  onlineProvider: string;
  onlineAmount: string;
  onlineTransactionId: string;
  paymentImage: File | null;
  paymentImagePreview: string;
  // separate गृहकर / पाणी कर amounts + proof screenshots (per payment)
  gharAmount: string;
  paniAmount: string;
  gharImage: File | null;
  gharImagePreview: string;
  paniImage: File | null;
  paniImagePreview: string;
}
