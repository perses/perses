# Gauge Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel/gauge"

var options []gauge.Option
gauge.Chart(options...)
```

Need a list of options.

## Default options

- Calculation(): last

## Available options

### Calculation

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/gauge" 

gauge.Calculation(common.Last)
```

Define the chart calculation.

### Format

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/gauge" 

gauge.Format(common.Format{...})
```

Define the chart format.

### Thresholds

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/gauge" 

gauge.Thresholds(common.Thresholds{...})
```

Define chart thresholds.

### Max

```golang
import "github.com/perses/perses/go-sdk/panel/gauge" 

gauge.Max(20)
```

Define the chart max value.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/dashboard"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/panel/gauge"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.AddPanel("Container memory",
				gauge.Chart(
					gauge.Calculation(common.LastCalculation),
					gauge.Format(common.Format{
						Unit: common.BytesUnit,
					}),
					gauge.Max(20),
				),
			),
		),
	)
}
```
