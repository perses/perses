# PromQL Variable builder

The PromQL Variable builder helps creating prometheus promQL variables in the format expected by Perses.

## Usage

```cue
package myDaC

import (
	promQLVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/promql"
)

promQLVarBuilder & {} // input parameters expected
```

## Parameters

| Parameter          | Type                                                            | Mandatory/Optional | Default             | Description                                                                                                                                                                           |
|--------------------|-----------------------------------------------------------------|--------------------|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `#name`            | string                                                          | Mandatory          |                     | The name of this variable.                                                                                                                                                            |
| `#display`         | [Display](../../../../api/variable.md#display-specification)    | Optional           |                     | Display object to tune the display name, description and visibility (show/hide).                                                                                                      |
| `#allowAllValue`   | boolean                                                         | Optional           | false               | Whether to append the "All" value to the list.                                                                                                                                        |
| `#allowMultiple`   | boolean                                                         | Optional           | false               | Whether to allow multi-selection of values.                                                                                                                                           |
| `#customAllValue`  | string                                                          | Optional           |                     | Custom value that will be used if `#allowAllValue` is true and if `All` is selected.                                                                                                  |
| `#capturingRegexp` | string                                                          | Optional           |                     | Regexp used to catch and filter the results of the query. If empty, then nothing is filtered (equivalent of setting it to `(.*)`).                                                    |
| `#sort`            | [Sort](../../../../api/variable.md#list-variable-specification) | Optional           |                     | Sort method to apply when rendering the list of values.                                                                                                                               |
| `#datasourceName`  | string                                                          | Mandatory          |                     | The name of the datasource to query.                                                                                                                                                  |
| `#metric`          | string                                                          | Optional           |                     | The name of the source metric to be used. /!\ Mandatory if you want to rely on the standard query pattern, thus didn't provide a value to the `#query` parameter.                     |
| `#label`           | string                                                          | Mandatory          | to `name` parameter | The label from which to retrieve the list of values. /!\ The [filter library](../filter.md) does NOT rely on this parameter to build the corresponding matcher, only `#name` is used. |
| `#query`           | string                                                          | Optional           |                     | Custom query to be used for this variable. /!\ Mandatory if you didn't provide a value to the `#metric` parameter.                                                                    |

## Output

| Field      | Type                                                           | Description                                               |
|------------|----------------------------------------------------------------|-----------------------------------------------------------|
| `variable` | [Variable](../../../../api/variable.md#variable-specification) | The final variable object, to be passed to the dashboard. |

## Example

```cue
package myDaC

import (
	promQLVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/promql"
)

{promQLVarBuilder & {
	#name:           "container"
	#metric:         "kube_pod_container_info"
	#allowAllValue:  true
	#allowMultiple:  true
	#datasourceName: "promDemo"
}}.variable
```
