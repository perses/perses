export type Operator = '=' | '!=' | '=~' | '!~';

export interface LabelFilter {
  label: string;
  labelValues: string[];
  operator?: Operator;
}

export function computeFilterExpr(filters: LabelFilter[]): string {
  return `${filters.map((filter) => `${filter.label}${filter.operator ? filter.operator : '=~'}"${filter.labelValues.join('|')}"`).join(',')}`;
}
