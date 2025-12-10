export enum B24MimeType {
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC = 'application/msword',
  TXT = 'text/plain',
  PDF = 'application/pdf',
  CSV = 'text/csv',
  JPG = 'image/jpeg',
  PNG = 'image/png',
  XML = 'application/xml',
}

export interface B24FileReceive {
  type: string;
  filename: string;
  content_type: B24MimeType;
  content_base64: string;
}

export interface B24FileUpload {
  name: string;
  file: string;
  code?: string;
}
