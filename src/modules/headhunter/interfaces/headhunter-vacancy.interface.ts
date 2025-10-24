export interface HHVacancyInterface {
  id: string
  premium: boolean
  billing_type: BillingType
  can_upgrade_billing_type: boolean
  relations: any[]
  name: string
  insider_interview: any
  response_letter_required: boolean
  area: Area
  salary: Salary
  salary_range: SalaryRange
  type: Type
  address: Address
  allow_messages: boolean
  experience: Experience
  schedule: Schedule
  employment: Employment
  department: any
  show_contacts: boolean
  contacts: Contacts
  description: string
  branded_description: any
  vacancy_constructor_template: any
  key_skills: any[]
  accept_handicapped: boolean
  accept_kids: boolean
  age_restriction: any
  archived: boolean
  response_url: any
  specializations: any[]
  professional_roles: ProfessionalRole[]
  code: any
  hidden: boolean
  quick_responses_allowed: boolean
  branded_template: any
  driver_license_types: any[]
  accept_incomplete_resumes: boolean
  employer: Employer
  published_at: string
  created_at: string
  initial_created_at: string
  negotiations_url: any
  suitable_resumes_url: any
  apply_alternate_url: string
  has_test: boolean
  test: any
  alternate_url: string
  counters: Counters
  expires_at: string
  manager: Manager
  response_notifications: boolean
  working_days: any[]
  working_time_intervals: any[]
  working_time_modes: any[]
  accept_temporary: boolean
  languages: any[]
  approved: boolean
  employment_form: EmploymentForm
  fly_in_fly_out_duration: any[]
  internship: boolean
  night_shifts: boolean
  work_format: WorkFormat[]
  work_schedule_by_days: WorkScheduleByDay[]
  working_hours: WorkingHour[]
  show_logo_in_search: any
  closed_for_applicants: boolean
  previous_id: any
  vacancy_properties: VacancyProperties
}

export interface BillingType {
  id: string
  name: string
}

export interface Area {
  id: string
  name: string
  url: string
}

export interface Salary {
  from: number
  to: number
  currency: string
  gross: boolean
}

export interface SalaryRange {
  from: number
  to: number
  currency: string
  gross: boolean
  mode: Mode
  frequency: Frequency
}

export interface Mode {
  id: string
  name: string
}

export interface Frequency {
  id: string
  name: string
}

export interface Type {
  id: string
  name: string
}

export interface Address {
  show_metro_only: boolean
}

export interface Experience {
  id: string
  name: string
}

export interface Schedule {
  id: string
  name: string
}

export interface Employment {
  id: string
  name: string
}

export interface Contacts {
  name: string
  email: string
  phones: Phone[]
  call_tracking_enabled: boolean
}

export interface Phone {
  comment: any
  city: string
  number: string
  country: string
  formatted: string
}

export interface ProfessionalRole {
  id: string
  name: string
}

export interface Employer {
  id: string
  name: string
  url: string
  alternate_url: string
  logo_urls: LogoUrls
  vacancies_url: string
  country_id: number
  accredited_it_employer: boolean
  trusted: boolean
}

export interface LogoUrls {
  original: string
  "90": string
  "240": string
}

export interface Counters {
  responses: number
  views: number
  invitations: number
  unread_responses: number
  resumes_in_progress: number
  invitations_and_responses: number
  calls: number
  new_missed_calls: number
}

export interface Manager {
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

export interface WorkScheduleByDay {
  id: string
  name: string
}

export interface WorkingHour {
  id: string
  name: string
}

export interface VacancyProperties {
  appearance: Appearance
  properties: Property[]
}

export interface Appearance {
  title: string
}

export interface Property {
  property_type: string
  parameters: any[]
  end_time: string
  start_time: string
}
