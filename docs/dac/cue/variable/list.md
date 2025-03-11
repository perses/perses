# List Variable builder

The List Variable builder helps creating list variables in the format expected by Perses.

!!! warning
	This lib is not meant for direct usage in DaC, as List variables are not standalone objects (they embed a plugin part).
	This lib should be used by plugin developers to develop wrappers for their variable plugins - as it was done for official plugins.

## Usage

```cue
package myDaC

import (
	listVarBuilder "github.com/perses/perses/cue/dac-utils/variable/list"
)

listVarBuilder & {} // input parameters expected
```

## Parameters

| Parameter          | Type                                                         | Mandatory/Optional | Default | Description                                                                                                                        |
|--------------------|--------------------------------------------------------------|--------------------|---------|------------------------------------------------------------------------------------------------------------------------------------|
| `#name`            | string                                                       | Mandatory          |         | The name of this variable.                                                                                                         |
| `#pluginKind`      | string                                                       | Mandatory          |         | The plugin kind of this variable.                                                                                                  |
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

Example of SDK definition for the Static List variable:

```cue
package myDaCLib

import (
	staticListVar "github.com/perses/plugins/staticlistvariable/schemas:model"
	listVarBuilder "github.com/perses/perses/cue/dac-utils/variable/list"
)

// include the definitions of listVarBuilder at the root
listVarBuilder

// specify the constraints for this variable
#pluginKind: staticListVar.kind
#values: [...staticListVar.#value]

variable: listVarBuilder.variable & {
	spec: {
		plugin: staticListVar & {
			spec: {
				values: #values
			}
		}
	}
}
```
