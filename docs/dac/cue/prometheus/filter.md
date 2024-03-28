# Filter builder

The Filter builder helps generating a filter, a.k.a a labels matcher expression.

## Usage

```cue
package myDaC

import (
	promFilterBuilder "github.com/perses/perses/cue/dac-utils/prometheus/filter"
)

promFilterBuilder & {} // input parameters expected
```

## Parameters

| Parameter | Type            | Mandatory/Optional | Default | Description                                                       |
|-----------|-----------------|--------------------|---------|-------------------------------------------------------------------|
| `#input`  | [...varBuilder] | Mandatory          |         | The list of variables builders from which to generate the filter. |

## Output

| Field    | Type   | Description                                                                                                                                    |
|----------|--------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `filter` | string | A labels matcher expression, that covers all the variables previously passed. E.g `{namespace="$namespace",pod="$pod",container="$container"}` |

## Example

```cue
package myDaC

import (
	promFilterBuilder "github.com/perses/perses/cue/dac-utils/prometheus/filter"
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
	promQLVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/promql"
	labelValuesVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/labelvalues"
)

{promFilterBuilder & {
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
}}.filter
```
