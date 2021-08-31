import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';

export interface PanelDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  display: {
    name: string;
  };
}

/**
 * Plugin the provides custom visualizations inside of a Panel.
 */
export interface PanelPlugin<Kind extends string, Options extends JsonObject> {
  PanelComponent: PanelComponent<Kind, Options>;
}

export type PanelComponent<
  Kind extends string,
  Options extends JsonObject
> = React.ComponentType<PanelProps<Kind, Options>>;

export interface PanelProps<Kind extends string, Options extends JsonObject> {
  definition: PanelDefinition<Kind, Options>;
}

export type AnyPanelDefinition = AnyPluginDefinition<'Panel'>;

export type AnyPanelPlugin = AnyPluginImplementation<'Panel'>;
