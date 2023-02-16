export interface StepOptions {
  value: number;
  color?: string;
  name?: string;
}

export interface ThresholdOptions {
  default_color?: string;
  max?: number; // is this same as the max in GaugeChartOptions? can we remove?
  steps?: StepOptions[];
}
