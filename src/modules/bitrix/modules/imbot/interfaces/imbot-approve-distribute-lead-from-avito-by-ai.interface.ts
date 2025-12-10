import { AvitoCreateLeadDto } from '@/modules/bitrix/modules/integration/avito/dtos/avito-create-lead.dto';

export interface ImbotApproveDistributeLeadFromAvitoByAi {
  message: Buffer<ArrayBuffer>;
  approved: boolean;
  fields: AvitoCreateLeadDto;
  phone: string;
}
