// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useRef } from 'react';
import {
  AnyChartQueryDefinition,
  JsonObject,
  AnyVariableDefinition,
  PanelProps,
  PluginConfig,
  PluginDefinition,
  PluginType,
  AnyPluginImplementation,
  AnyPluginDefinition,
} from '@perses-ui/core';

/**
 * Take a Variable plugin and wrap it so it works with AnyVariableDefinition,
 * doing runtime checking of the definition before delegating to the plugin.
 */
export function createVariablePlugin<
  Kind extends string,
  Options extends JsonObject
>(
  config: PluginConfig<'Variable', Kind, Options>
): AnyPluginImplementation<'Variable'> {
  // Create runtime validation function
  const useRuntimeValidation = createValidationHook(config);

  // Wrap hook with validation (TODO: Can this wrapper become generic for all
  // plugin hooks?)
  function useVariableOptions(definition: AnyVariableDefinition) {
    const { isValid, errorRef } = useRuntimeValidation();
    if (isValid(definition)) {
      return config.plugin.useVariableOptions(definition);
    }
    throw errorRef.current;
  }

  return {
    useVariableOptions,
  };
}

/**
 * Take a Panel plugin and wraps it so it works with AnyPanelDefinition, doing
 * runtime checking of the definition before delegating to the plugin.
 */
export function createPanelPlugin<
  Kind extends string,
  Options extends JsonObject
>(
  config: PluginConfig<'Panel', Kind, Options>
): AnyPluginImplementation<'Panel'> {
  const useRuntimeValidation = createValidationHook(config);

  // Wrap PanelComponent from config with validation (TODO: Can this wrapper
  // become generic for all Plugin components?)
  function PanelComponent(props: PanelProps<string, JsonObject>) {
    const { definition, ...others } = props;

    const { isValid, errorRef } = useRuntimeValidation();
    if (isValid(definition)) {
      const { PanelComponent } = config.plugin;
      return <PanelComponent definition={definition} {...others} />;
    }
    throw errorRef.current;
  }

  return {
    PanelComponent,
  };
}

/**
 * Take a ChartQuery plugin and wrap it so it works with AnyChartQueryDefinition,
 * doing runtime validation of the definition before delegating to the plugin.
 */
export function createChartQueryPlugin<
  Kind extends string,
  Options extends JsonObject
>(
  config: PluginConfig<'ChartQuery', Kind, Options>
): AnyPluginImplementation<'ChartQuery'> {
  // Create runtime validation function
  const useRuntimeValidation = createValidationHook(config);

  // Wrap hook with validation (TODO: Can this wrapper become generic for all
  // plugin hooks?)
  function useChartQuery(definition: AnyChartQueryDefinition) {
    const { isValid, errorRef } = useRuntimeValidation();
    if (isValid(definition)) {
      return config.plugin.useChartQuery(definition);
    }
    throw errorRef.current;
  }

  return {
    useChartQuery,
  };
}

// A hook for doing runtime validation of a PluginDefinition
type UseRuntimeValidationHook<
  Type extends PluginType,
  Kind extends string,
  Options extends JsonObject
> = () => {
  isValid: (
    definition: AnyPluginDefinition<Type>
  ) => definition is PluginDefinition<Type, Kind, Options>;
  errorRef: React.MutableRefObject<InvalidPluginDefinitionError | undefined>;
};

// Create a hook for doing runtime validation of a plugin definition, given the
// plugin's config
function createValidationHook<
  Type extends PluginType,
  Kind extends string,
  Options extends JsonObject
>(
  config: PluginConfig<Type, Kind, Options>
): UseRuntimeValidationHook<Type, Kind, Options> {
  const useRuntimeValidation = () => {
    // Ref for storing any validation errors as a side-effect of calling isValid
    const errorRef = useRef<InvalidPluginDefinitionError | undefined>(
      undefined
    );

    // Type guard that validates the generic runtime plugin definition data
    // is correct for Kind/Options
    const isValid = (
      definition: AnyPluginDefinition<Type>
    ): definition is PluginDefinition<Type, Kind, Options> => {
      // If they don't give us a validate function in the plugin config, not
      // much we can do so just assume we're OK
      const validateErrors = config.validate?.(definition) ?? [];
      if (validateErrors.length === 0) return true;

      errorRef.current = new InvalidPluginDefinitionError(
        config.pluginType,
        config.kind,
        validateErrors
      );
      return false;
    };

    return {
      isValid,
      errorRef,
    };
  };

  return useRuntimeValidation;
}

/**
 * Thrown when ConfigData fails the runtime validation check for a plugin.
 */
export class InvalidPluginDefinitionError extends Error {
  constructor(
    readonly pluginType: PluginType,
    readonly kind: string,
    readonly validateErrors: string[]
  ) {
    super(`Invalid ${pluginType} plugin definition for kind ${kind}`);
  }
}
