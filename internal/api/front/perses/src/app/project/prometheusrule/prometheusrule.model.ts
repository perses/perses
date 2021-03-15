import { Metadata } from '../../shared/model/metadata.model';
import { HeaderModel } from '../../shared/model/kind.model';

export interface Rule {
  record: string;
  alert: string;
  expr: string;
  for?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface RuleGroup {
  name: string;
  internal: string;
  rules: Rule[];
}

export interface PrometheusRuleSpec {
  groups: RuleGroup[];
}

export interface PrometheusRuleModel extends HeaderModel {
  metadata: Metadata;
  spec: PrometheusRuleSpec;
}
