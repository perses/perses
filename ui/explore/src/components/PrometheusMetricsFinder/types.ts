export interface LabelFilter {
  label: string;
  labelValues: string[];
}

export function computeFilterExpr(filters: LabelFilter[]): string {
  return `${filters.map((filter) => `${filter.label}=~"${filter.labelValues.join('|')}"`).join(',')}`;
}
