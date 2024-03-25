# Text Variable builder

The Text Variable builder helps creating text variables in the format expected by Perses.

## Usage

```cue
package myDaC

import (
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
)

textVarBuilder & {} // input parameters expected
```

## Parameters

| Parameter   | Type                                                      | Mandatory/Optional | Default | Description                                                                      |
|-------------|-----------------------------------------------------------|--------------------|---------|----------------------------------------------------------------------------------|
| `#name`     | string                                                    | Mandatory          |         | The name of this variable.                                                       |
| `#display`  | [Display](../../../api/variable.md#display-specification) | Optional           |         | Display object to tune the display name, description and visibility (show/hide). |
| `#value`    | string                                                    | Mandatory          |         | The value of this variable.                                                      |
| `#constant` | bool                                                      | Mandatory          | false   | Whether this variable is a constant.                                             |

## Output

| Field      | Type                                                        | Description                                               |
|------------|-------------------------------------------------------------|-----------------------------------------------------------|
| `variable` | [Variable](../../../api/variable.md#variable-specification) | The final variable object, to be passed to the dashboard. |

## Example

```cue
package myDaC

import (
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
)

{textVarBuilder & {
	#name:     "prometheus"
	#value:    "platform"
	#constant: true
}}.variable
```
