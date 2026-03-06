import {
  TelphinEventCallFlow,
  TelphinEventCallStatus,
  TelphinEventType,
} from '@/modules/telphin/interfaces/telphin-events.interface';

export interface BitrixEventsAnswerOptions {
  CalledExtension?: string;
  CalledExtensionID?: string;
  CallerExtension: string;
  CallerExtensionID: string;
  EventType: TelphinEventType;
  CallID: string;
  CallerIDNum: string;
  CallerIDName: string;
  CalledDID?: string;
  CallStatus: TelphinEventCallStatus;
  CallFlow: TelphinEventCallFlow;
  CalledNumber: string;
  SubCallID: string;
  CallAPIID: string;
  EventTime: string;
}
