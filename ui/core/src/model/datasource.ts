import { Definition, JsonObject } from './definitions';
import { ResourceMetadata } from './resource';

export interface DataSourceResource {
  kind: 'DataSource';
  metadata: ResourceMetadata;
  spec: {
    data_source: AnyDataSourceDefinition;
  };
}

export interface DataSourceDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  display: {
    hide?: boolean;
  };
}

export type AnyDataSourceDefinition = DataSourceDefinition<string, JsonObject>;
