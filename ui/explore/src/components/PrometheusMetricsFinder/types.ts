import { DatasourceSelector } from '@perses-dev/core';

export type Operator = '=' | '!=' | '=~' | '!~';

export type DisplayMode = 'grid' | 'list';

export interface FinderQueryParams {
  display?: DisplayMode;
  datasource?: DatasourceSelector;
  filters?: LabelFilter[];
  exploredMetric?: string;
}

export interface LabelFilter {
  label: string;
  labelValues: string[];
  operator?: Operator;
}

export function computeFilterExpr(filters: LabelFilter[]): string {
  return `${filters.map((filter) => `${filter.label}${filter.operator ? filter.operator : '=~'}"${filter.labelValues.join('|')}"`).join(',')}`;
}

export interface LabelValueCounter {
  labelValue: string;
  counter: number;
}
