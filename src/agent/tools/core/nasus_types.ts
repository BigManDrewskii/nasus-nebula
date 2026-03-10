export type NasusModuleId =
  | 'M00' | 'M01' | 'M02' | 'M03' | 'M04'
  | 'M05' | 'M06' | 'M07' | 'M08' | 'M09'
  | 'M10' | 'M11';

export type NasusStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';

export interface NasusEnvelope {
  job_id: string;
  module_id: NasusModuleId;
  status: NasusStatus;
  payload: Record<string, unknown>;
  errors: string[];
  created_at: string;
  updated_at: string;
}

export interface NasusHealthResponse {
  status: string;
  version: string;
  modules: string[];
}
