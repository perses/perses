# Variable Group builder

The Variable Group builder takes care of generating a pattern that we often see in dashboards: when you have e.g 3 variables A, B and C, it's quite common to "bind" them together so that B depends on A, and C depends on B + A.

## Usage

```cue
package myDaC

import (
	varGroupBuilder "github.com/perses/perses/cue/dac-utils/variable/group"
)

varGroupBuilder & {} // input parameters expected
```

## Parameters

| Parameter         | Type    | Mandatory/Optional | Default | Description                                                                                                                                                             |
|-------------------|---------|--------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `#input`          | [...{}] | Mandatory          |         | The list of variables to be grouped.                                                                                                                                    |
| `#datasourceName` | string  | Optional           |         | Datasource to be used for all the variables of this group. Avoids the necessity to provide the datasource name for each variable when you want to use the same for all. |

Technically the array could contain any kind of object, still it is meant to receive variables builder entries that are going to do something with the dependencies appended by the Variable Group builder.
You can also pass to it variables for which the notion of dependencies don't/can't apply (like text variables or static lists) but that will still be used as dependencies for the following variables.

## Outputs

| Field         | Type                                                             | Description                                                                |
|---------------|------------------------------------------------------------------|----------------------------------------------------------------------------|
| `variables`   | [...[Variable](../../../api/variable.md#variable-specification)] | The final list of variables objects, to be passed to the dashboard.        |
| `queryParams` | string                                                           | A query string including all variables from the group, to be used in urls. |

## Example

```cue
package myDaC

import (
	varGroupBuilder "github.com/perses/perses/cue/dac-utils/variable/group"
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
	promQLVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/promql"
	labelValuesVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/labelvalues"
)

{varGroupBuilder & {
	#input: [
		textVarBuilder & {
			#name:     "prometheus"
			#value:    "platform"
			#constant: true
		},
		labelValuesVarBuilder & {
			#name: "stack"
			#display: name: "PaaS"
			#metric:         "thanos_build_info"
			#label:          "stack"
			#datasourceName: "promDemo"
		},
		promQLVarBuilder & {
			#name:           "namespace"
			#metric:         "kube_namespace_labels"
			#allowMultiple:  true
			#datasourceName: "promDemo"
		}
	]
}}.variables
```
