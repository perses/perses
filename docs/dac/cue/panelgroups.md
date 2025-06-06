# Panel Groups builder

The Panel Groups builder helps creating panel groups easily.

## Usage

```cue
package myDaC

import (
    panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
)

panelGroupsBuilder & {} // input parameter expected
```

## Parameters

| Parameter | Type                   | Description                                                         |
|-----------|------------------------|---------------------------------------------------------------------|
| `#input`  | [...panelGroupBuilder] | Each array element provides the information to build a panel group. |

### panelGroupBuilder parameters

| Parameter | Type                                                     | Mandatory/Optional | Default | Description                                           |
|-----------|----------------------------------------------------------|--------------------|---------|-------------------------------------------------------|
| `#panels` | [...[Panel](../../api/dashboard.md#panel-specification)] | Mandatory          |         | An array of panels to be included in the panel group. |
| `#title`  | string                                                   | Mandatory          |         | The title of the panel group.                         |
| `#cols`   | >0 & <=24                                                | Mandatory          |         | The number of columns in the grid layout.             |
| `#height` | number                                                   | Optional           | 6       | The height for all panels in the grid                 |

## Example

```cue
package myDaC

import (
    panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
)

#memoryPanel: {} // v1.#Panel object
#cpuPanel: {} // v1.#Panel object

panelGroupsBuilder & {
	#input: [
		{
			#title: "Resource usage"
			#cols:  3
			#panels: [
				#memoryPanel,
				#cpuPanel,
			]
		},
		{
			#title:  "Resource usage bis"
			#cols:   1
			#height: 4
			#panels: [
				#cpuPanel,
				#memoryPanel,
			]
		},
	]
}
```
