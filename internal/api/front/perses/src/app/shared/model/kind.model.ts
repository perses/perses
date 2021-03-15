export enum Kind {
  project = 'Project',
  prometheusRule = 'PrometheusRule'
}

export interface HeaderModel {
  kind: Kind;
}
