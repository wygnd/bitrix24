export interface B24EventAdd {
  event: string;
  handler: string;
  auth_type?: number;
  event_type?: string;
  auth_connector?: string;
  options?: string;
}
