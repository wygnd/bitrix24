export interface QueueEventCompleted<T = any> {
  jobId: string;
  returnvalue: T;
  prev?: string;
}

export interface QueueEventActive {
  jobId: string;
  prev?: string;
}

export interface QueueEventAdded {
  jobId: string;
  prev?: string;
  name: string;
}

export interface QueueEventFailed {
  jobId: string;
  failedReason: string;
  prev?: string;
}
