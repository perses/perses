import { Definition, UnknownSpec } from './definitions';

export interface Transform<PluginSpec = UnknownSpec> extends Definition<TransformationSpec<PluginSpec>> {
  kind: 'Transform';
}

export interface TransformationSpec<PluginSpec = UnknownSpec> {
  plugin: Definition<PluginSpec>;
  disabled?: boolean;
}

export interface JoinTransformSpec {
  kind: 'JoinByColumnValue';
  spec: {
    column: string;
  };
}

export interface MergeTransformSpec {
  kind: 'MergeIndexedColumns';
  spec: {
    column: string;
  };
}

// Can be moved somewhere else
export const TRANSFORM_TEXT = {
  JoinByColumnValue: 'Join by column value',
  MergeIndexedColumns: 'Merge indexed columns',
};
