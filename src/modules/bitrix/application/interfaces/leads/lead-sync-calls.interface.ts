export interface BitrixSyncCallOptions {
  phone: string;
  avito_number: string;
  avito_name: string;
}

export interface BitrixSyncCalls {
  only_new?: string;
  calls: BitrixSyncCallOptions[];
}
