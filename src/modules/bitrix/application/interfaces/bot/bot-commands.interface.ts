export interface BitrixBotCommandsAttributes {
  id: number;
  botId: number;
  commandId: number;
  command: string;
  description?: string;
  handler: string;
}

export type BitrixBotCommandsCreationalAttributes = Omit<
  BitrixBotCommandsAttributes,
  'id'
>;

export type BitrixBotCommandsUpdateAttributes =
  Partial<BitrixBotCommandsCreationalAttributes>;
