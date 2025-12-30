export interface B24WikiClientPaymentsAttributes {
  id: number;
  inn: string;
  departmentId: number;
  departmentName: string;
  createdAt: Date;
  updatedAt: Date;
}

export type B24WikiClientPaymentsCreationalAttributes = Omit<
  B24WikiClientPaymentsAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;
