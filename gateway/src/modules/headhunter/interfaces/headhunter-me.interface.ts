export interface HHMeInterface {
  auth_type: string
  is_applicant: boolean
  is_employer: boolean
  is_admin: boolean
  is_hiring_manager: boolean
  is_application: boolean
  is_employer_integration: boolean
  id: string
  is_anonymous: boolean
  email: string
  first_name: string
  middle_name: any
  last_name: string
  resumes_url: any
  negotiations_url: any
  is_in_search: any
  mid_name: any
  employer: Employer
  manager: Manager
  phone: any
  personal_manager: PersonalManager
}

interface Employer {
  id: string
  name: string
  creation_time: string
  manager_id: string
}

interface Manager {
  id: string
  is_main_contact_person: boolean
  has_admin_rights: boolean
  manager_settings_url: string
  has_multiple_manager_accounts: boolean
}

interface PersonalManager {
  id: string
  email: string
  first_name: string
  last_name: string
  photo_urls: any
  is_available: boolean
  unavailable: any
}
