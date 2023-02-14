// TODO (sjcobb): pull threshold colors from perses charts theme
// TODO: REMOVE???
export const ThresholdColors = {
  GREEN: 'rgba(47, 191, 114, 1)', // green.500
  YELLOW: 'rgba(255, 193, 7, 1)',
  ORANGE: 'rgba(255, 159, 28, 0.9)', // orange.500
  RED: 'rgba(234, 71, 71, 1)', // red.500
};

export interface StepOptions {
  value: number;
  color?: string;
  name?: string;
}

export interface ThresholdOptions {
  default_color?: string; // TO DO: REMOVE, get it from charts theme
  max?: number;
  steps?: StepOptions[];
}
