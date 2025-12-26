export enum TelphinEventType {
  INCOMING = 'dial-in',
  OUTGOING = 'dial-out',
  HANGUP = 'hangup',
  ANSWER = 'answer',
  MESSAGE_IN = 'message-in',
  MESSAGE_OUT = 'message-out',
  VOICEMAIL = 'voicemail',
}

export type TelphinEventCallStatus =
  | 'CALLING'
  | 'ANSWER'
  | 'BUSY'
  | 'NOANSWER'
  | 'CANCEL'
  | 'CONGESTION'
  | 'CHANUNAVAIL';

export type TelphinEventCallFlow = 'IN' | 'OUT';
