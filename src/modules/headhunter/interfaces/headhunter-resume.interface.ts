export interface HHResumeInterface {
  last_name: string
  first_name: string
  middle_name: string
  title: string
  created_at: string
  updated_at: string
  area: Area
  age: number
  gender: Gender
  salary: Salary
  photo: Photo
  total_experience: TotalExperience
  certificate: any[]
  owner: Owner
  can_view_full_info: boolean
  negotiations_history: NegotiationsHistory
  hidden_fields: any[]
  actions: Actions
  alternate_url: string
  id: string
  download: Download2
  platform: Platform
  employment_form: EmploymentForm[]
  work_format: WorkFormat[]
  real_id: string
  resume_locale: ResumeLocale
  skills: string
  citizenship: Citizenship[]
  work_ticket: WorkTicket[]
  birth_date: string
  education: Education
  employment: Employment
  employments: Employment2[]
  experience: Experience[]
  language: Language[]
  metro: any
  recommendation: any[]
  relocation: Relocation
  schedule: Schedule
  schedules: Schedule2[]
  site: any[]
  travel_time: TravelTime
  business_trip_readiness: BusinessTripReadiness
  paid_services: any[]
  portfolio: any[]
  skill_set: string[]
  favorited: boolean
  has_vehicle: boolean
  driver_license_types: DriverLicenseType[]
  view_without_contacts_reason: any
  contact: Contact[]
  specialization: any[]
  professional_roles: ProfessionalRole[]
  tags: any[]
}

export interface Area {
  id: string
  name: string
  url: string
}

export interface Gender {
  id: string
  name: string
}

export interface Salary {
  amount: number
  currency: string
}

export interface Photo {
  small: string
  medium: string
  "40": string
  "100": string
  "500": string
}

export interface TotalExperience {
  months: number
}

export interface Owner {
  id: string
  comments: Comments
}

export interface Comments {
  url: string
  counters: Counters
}

export interface Counters {
  total: number
}

export interface NegotiationsHistory {
  url: string
}

export interface Actions {
  download: Download
}

export interface Download {
  pdf: Pdf
  rtf: Rtf
}

export interface Pdf {
  url: string
}

export interface Rtf {
  url: string
}

export interface Download2 {
  pdf: Pdf2
  rtf: Rtf2
}

export interface Pdf2 {
  url: string
}

export interface Rtf2 {
  url: string
}

export interface Platform {
  id: string
}

export interface EmploymentForm {
  id: string
  name: string
}

export interface WorkFormat {
  id: string
  name: string
}

export interface ResumeLocale {
  id: string
  name: string
}

export interface Citizenship {
  id: string
  name: string
  url: string
}

export interface WorkTicket {
  id: string
  name: string
  url: string
}

export interface Education {
  level: Level
  primary: Primary[]
  additional: any[]
  attestation: any[]
  elementary: any[]
}

export interface Level {
  id: string
  name: string
}

export interface Primary {
  id: string
  name: string
  organization: string
  result: string
  year: number
  university_acronym: any
  name_id: any
  organization_id: any
  result_id: any
  education_level: EducationLevel
}

export interface EducationLevel {
  id: string
  name: string
}

export interface Employment {
  id: string
  name: string
}

export interface Employment2 {
  id: string
  name: string
}

export interface Experience {
  start: string
  end?: string
  company: string
  company_id?: string
  industry?: Industry
  industries: Industry2[]
  area?: Area2
  company_url?: string
  employer?: Employer
  position: string
  description: string
}

export interface Industry {
  id: string
  name: string
}

export interface Industry2 {
  id: string
  name: string
}

export interface Area2 {
  id: string
  name: string
  url: string
}

export interface Employer {
  id: string
  name: string
  url: string
  alternate_url: string
  logo_urls: LogoUrls
}

export interface LogoUrls {
  "240": string
  original: string
  "90": string
}

export interface Language {
  id: string
  name: string
  level: Level2
}

export interface Level2 {
  id: string
  name: string
}

export interface Relocation {
  type: Type
  area: any[]
  district: any[]
}

export interface Type {
  id: string
  name: string
}

export interface Schedule {
  id: string
  name: string
}

export interface Schedule2 {
  id: string
  name: string
}

export interface TravelTime {
  id: string
  name: string
}

export interface BusinessTripReadiness {
  id: string
  name: string
}

export interface DriverLicenseType {
  id: string
}

export interface Contact {
  value: any
  type: Type2
  preferred: boolean
  comment: any
  contact_value: string
  kind: string
  need_verification?: boolean
  verified?: boolean
}

export interface Type2 {
  id: string
  name: string
}

export interface ProfessionalRole {
  id: string
  name: string
}
