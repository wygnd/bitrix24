export interface ImbotHandleApproveSmmAdvertLayout {
  taskId: string;
  isApproved: boolean;
  responsibleId: string;
  accomplices: string[];
  message: Uint8Array<ArrayBuffer>;
}
