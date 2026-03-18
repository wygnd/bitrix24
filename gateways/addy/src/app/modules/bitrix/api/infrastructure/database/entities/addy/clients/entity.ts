export interface IB24AddyClientModel {
  id: number;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export type TB24AddyClientCreationModel = Omit<
  IB24AddyClientModel,
  'id' | 'created_at' | 'updated_at'
>;
