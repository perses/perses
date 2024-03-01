# Panel Groups builder

The Panel Groups builder helps creating panel groups easily.

## Usage

```cue
package myPackage

import (
    panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
)

panelGroupsBuilder & {} // input parameter expected
```

## Parameters

| Parameter | Type                   | Description                                                         |
|-----------|------------------------|---------------------------------------------------------------------|
| `#input`  | [...panelGroupBuilder] | Each array element provides the information to build a panel group. |

### panelGroupBuilder parameters

| Parameter | Type                                            | Default | Description                                           |
|-----------|-------------------------------------------------|---------|-------------------------------------------------------|
| `#panels` | [...[Panel](../../api/dashboard.md#panel_spec)] |         | An array of panels to be included in the panel group. |
| `#title`  | string                                          |         | The title of the panel group.                         |
| `#cols`   | >0 & <=24                                       |         | The number of columns in the grid layout.             |
| `#height` | number                                          | 6       | The height for all panels in the grid                 |

## Example

```cue
package myPackage

import (
    panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
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

To build panels please refer to the [Prometheus Panel builder](prometheus/panel.md)
