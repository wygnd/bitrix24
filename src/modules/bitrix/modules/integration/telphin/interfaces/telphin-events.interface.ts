import {
  TelphinEventCallFlow,
  TelphinEventCallStatus,
  TelphinEventType,
} from '@/modules/telphin/interfaces/telphin-events.interface';

export interface BitrixEventsAnswerOptions {
  CalledExtension: string;
  CalledExtensionID: number;
  CallerExtension: string;
  CallerExtensionID: number;
  EventType: TelphinEventType;
  CallID: string;
  CallerIDNum: string;
  CallerIDName: string;
  CalledDID: string;
  CallStatus: TelphinEventCallStatus;
  CallFlow: TelphinEventCallFlow;
  CalledNumber: string;
  SubCallID: string;
  CallAPIID: string;
  EventTime: string;
}
