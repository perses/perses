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

| Parameter         | Type                                                         | Mandatory/Optional | Default             | Description                                                                      |
|-------------------|--------------------------------------------------------------|--------------------|---------------------|----------------------------------------------------------------------------------|
| `#name`           | string                                                       | Mandatory          |                     | The name of this variable.                                                       |
| `#display`        | [Display](../../../../api/variable.md#display-specification) | Optional           |                     | Display object to tune the display name, description and visibility (show/hide). |
| `#allowAllValue`  | boolean                                                      | Optional           | false               | Whether to append the "All" value to the list.                                   |
| `#allowMultiple`  | boolean                                                      | Optional           | false               | Whether to allow multi-selection of values.                                      |
| `#metric`         | string                                                       | Mandatory          |                     | The name of the source metric to be used.                                        |
| `#label`          | string                                                       | Mandatory          | to `name` parameter | The label from which to retrieve the list of values.                             |
| `#datasourceName` | string                                                       | Mandatory          |                     | The name of the datasource to query.                                             |

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