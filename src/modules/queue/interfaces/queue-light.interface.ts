import { B24DealCategories } from '@/modules/bitrix/interfaces/bitrix.interface';

export interface QueueLightAddTaskHandleUpsellDeal {
  upsellId: number;
  dealId: string;
  leadId: string;
  category: B24DealCategories;
  dealStage: string;
}
