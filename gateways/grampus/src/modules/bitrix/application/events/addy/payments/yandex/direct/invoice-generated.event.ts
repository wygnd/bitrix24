export class YandexDirectInvoiceGeneratedEvent {
  constructor(
    public readonly invoice_number: string,
    public readonly invoice_id: string | number,
  ) {}
}
