import { AbsoluteTimeRange, UnknownSpec, LogData } from '@perses-dev/core';
import { DatasourceStore, Plugin, VariableStateMap } from '@perses-dev/plugin-system';

export interface LogQueryResult {
  logs: LogData;
  timeRange: AbsoluteTimeRange;
  metadata?: {
    executedQueryString: string;
  };
}

export interface LogQueryContext {
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasourceStore: DatasourceStore;
  refreshKey: string;
}

type LogQueryPluginDependencies = {
  variables?: string[];
};

export interface LogQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getLogData: (spec: Spec, ctx: LogQueryContext) => Promise<LogQueryResult>;
  dependsOn?: (spec: Spec, ctx: LogQueryContext) => LogQueryPluginDependencies;
}
