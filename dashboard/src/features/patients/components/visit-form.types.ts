export type T2dmAssessment = {
  symptomsDuration: string
  familyHistory: "" | "Yes" | "No" | "Unknown"
  polyuria: "" | "Yes" | "No" | "Unknown"
  polydipsia: "" | "Yes" | "No" | "Unknown"
  randomBloodGlucose: string
  hba1c: string
}

export const emptyT2dmAssessment = (): T2dmAssessment => ({
  symptomsDuration: "",
  familyHistory: "",
  polyuria: "",
  polydipsia: "",
  randomBloodGlucose: "",
  hba1c: "",
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
