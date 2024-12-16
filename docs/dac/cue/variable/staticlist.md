# Static List Variable builder

The Static List Variable builder helps creating static list variables in the format expected by Perses.

## Usage

```cue
package myDaC

import (
	staticListVarBuilder "github.com/perses/perses/cue/dac-utils/variable/staticlist"
)

staticListVarBuilder & {} // input parameters expected
```

## Parameters

| Parameter          | Type                                                         | Mandatory/Optional | Default | Description                                                                                                                        |
|--------------------|--------------------------------------------------------------|--------------------|---------|------------------------------------------------------------------------------------------------------------------------------------|
| `#name`            | string                                                       | Mandatory          |         | The name of this variable.                                                                                                         |
| `#values`          | [...(string \| { value: string, label?: string })]           | Mandatory          |         | The list of values of this variable.                                                                                               |
| `#display`         | [Display](../../../api/variable.md#display-specification)    | Optional           |         | Display object to tune the display name, description and visibility (show/hide).                                                   |
| `#allowAllValue`   | boolean                                                      | Optional           | false   | Whether to append the "All" value to the list.                                                                                     |
| `#allowMultiple`   | boolean                                                      | Optional           | false   | Whether to allow multi-selection of values.                                                                                        |
| `#customAllValue`  | string                                                       | Optional           |         | Custom value that will be used if `#allowAllValue` is true and if `All` is selected.                                               |
| `#capturingRegexp` | string                                                       | Optional           |         | Regexp used to catch and filter the results of the query. If empty, then nothing is filtered (equivalent of setting it to `(.*)`). |
| `#sort`            | [Sort](../../../api/variable.md#list-variable-specification) | Optional           |         | Sort method to apply when rendering the list of values.                                                                            |

## Output

| Field      | Type                                                        | Description                                               |
|------------|-------------------------------------------------------------|-----------------------------------------------------------|
| `variable` | [Variable](../../../api/variable.md#variable-specification) | The final variable object, to be passed to the dashboard. |

## Example

```cue
package myDaC

import (
	staticListVarBuilder "github.com/perses/perses/cue/dac-utils/variable/staticlist"
)

{staticListVarBuilder & {
	#name:     "prometheus"
	#values:   ["one", "two", {value: "three", label: "THREE" }]
}}.variable
```
