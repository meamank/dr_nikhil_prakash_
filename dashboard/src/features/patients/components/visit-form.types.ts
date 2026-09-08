export type T2dmAssessment = {
  symptomsDuration: string
  polyuria: boolean
  polydipsia: boolean
  polyphagia: boolean
  unexplainedWeightLoss: boolean
  blurredVision: boolean
  fatigueOrLethargy: boolean
  age35OrOlder: boolean
  overweightOrObese: boolean
  highRiskEthnicity: boolean
  firstDegreeRelative: boolean
  historyOfCvd: boolean
  hypertension: boolean
  historyOfGdm: boolean
  pcos: boolean
  physicalInactivity: boolean
  fruityBreathOdor: boolean
  kussmaulRespirations: boolean
  intractableNauseaVomiting: boolean
  alteredMentalStatus: boolean
  neuropathicSymptoms: boolean
  footComplications: boolean
  visionChangesOrFloaters: boolean
  exertionalChestPainOrSob: boolean
}

export const emptyT2dmAssessment = (): T2dmAssessment => ({
  symptomsDuration: "",
  polyuria: false,
  polydipsia: false,
  polyphagia: false,
  unexplainedWeightLoss: false,
  blurredVision: false,
  fatigueOrLethargy: false,
  age35OrOlder: false,
  overweightOrObese: false,
  highRiskEthnicity: false,
  firstDegreeRelative: false,
  historyOfCvd: false,
  hypertension: false,
  historyOfGdm: false,
  pcos: false,
  physicalInactivity: false,
  fruityBreathOdor: false,
  kussmaulRespirations: false,
  intractableNauseaVomiting: false,
  alteredMentalStatus: false,
  neuropathicSymptoms: false,
  footComplications: false,
  visionChangesOrFloaters: false,
  exertionalChestPainOrSob: false,
})

export type IbsAssessment = {
  romePainWeekly: boolean
  romeDefecationRelated: boolean
  romeStoolChange: boolean
  romeDurationSixMonths: boolean
  redFlagWeightLoss: boolean
  redFlagBleeding: boolean
  redFlagIronDeficiencyAnemia: boolean
  redFlagFever: boolean
  redFlagNocturnalSymptoms: boolean
  redFlagOnsetAfter50: boolean
  redFlagFamilyHistory: boolean
  bristolStoolType: "" | "1" | "2" | "3" | "4" | "5" | "6" | "7"
  subtype: "" | "IBS-C" | "IBS-D" | "IBS-M" | "IBS-U"
  painSeverity: number
  painFrequency: number
  bloating: number
  bowelDissatisfaction: number
  lifeInterference: number
  missedWork: boolean
  avoidsTravelOrSocial: boolean
  toiletAnxiety: boolean
  dominatesDailyThinking: boolean
  anxietySymptoms: boolean
  lowMoodOrDepression: boolean
}

export const emptyIbsAssessment = (): IbsAssessment => ({
  romePainWeekly: false,
  romeDefecationRelated: false,
  romeStoolChange: false,
  romeDurationSixMonths: false,
  redFlagWeightLoss: false,
  redFlagBleeding: false,
  redFlagIronDeficiencyAnemia: false,
  redFlagFever: false,
  redFlagNocturnalSymptoms: false,
  redFlagOnsetAfter50: false,
  redFlagFamilyHistory: false,
  bristolStoolType: "",
  subtype: "",
  painSeverity: 0,
  painFrequency: 0,
  bloating: 0,
  bowelDissatisfaction: 0,
  lifeInterference: 0,
  missedWork: false,
  avoidsTravelOrSocial: false,
  toiletAnxiety: false,
  dominatesDailyThinking: false,
  anxietySymptoms: false,
  lowMoodOrDepression: false,
})
