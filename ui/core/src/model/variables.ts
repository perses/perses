import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';
import { ResourceSelector } from './resource';

export interface VariableDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  datasource?: ResourceSelector;
  display: VariableDisplayOptions;
  selection: VariableSelectionOptions;
  capturing_regexp?: string;
}

export interface VariableDisplayOptions extends JsonObject {
  hide?: boolean;
  label: string;
}

export type VariableSelectionOptions = SingleSelectOptions | MultiSelectOptions;

export type SingleSelectOptions = {
  default_value: string;
};

export type MultiSelectOptions = {
  default_value: string[];
  all_value?: string | typeof DEFAULT_ALL_VALUE;
};

export const DEFAULT_ALL_VALUE = '$__all' as const;

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<
  Kind extends string,
  Options extends JsonObject
> {
  useVariableOptions: UseVariableOptionsHook<Kind, Options>;
}

/**
 * Plugin hook responsible for getting the options of a custom variable
 * definition.
 */
export type UseVariableOptionsHook<
  Kind extends string,
  Options extends JsonObject
> = (definition: VariableDefinition<Kind, Options>) => {
  data: string[];
  loading: boolean;
  error?: Error;
};

export type AnyVariableDefinition = AnyPluginDefinition<'Variable'>;

export type AnyVariablePlugin = AnyPluginImplementation<'Variable'>;
