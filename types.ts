export enum ModuleID {
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
  LOGIC = 'LOGIC',
  METRICS = 'METRICS'
}

export interface GridConfig {
  id: ModuleID;
  title: string;
  code: string;
  gridArea: string; // CSS Grid Area
}