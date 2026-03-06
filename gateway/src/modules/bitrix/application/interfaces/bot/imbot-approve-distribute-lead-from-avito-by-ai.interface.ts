import { AvitoCreateLeadDto } from '@/modules/bitrix/application/dtos/avito/avito-create-lead.dto';

export interface ImbotApproveDistributeLeadFromAvitoByAi {
  message: Buffer<ArrayBuffer>;
  approved: boolean;
  fields: AvitoCreateLeadDto;
  phone: string;
}
