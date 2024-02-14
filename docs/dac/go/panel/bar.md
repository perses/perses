# Bar Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel/bar"

var options []bar.Option
bar.Chart(options...)
```

Need a list of options.

## Default options

- Calculation(): last

## Available options

### Calculation

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/bar" 

bar.Calculation(common.Last)
```

Define the chart calculation.

### Format

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/bar" 

bar.Format(common.Format{...})
```

Define the chart format.

### SortingBy

```golang
import "github.com/perses/perses/go-sdk/panel/bar" 

bar.SortingBy(bar.AscSort)
```

Define the chart sorting.

### WithMode

```golang
import "github.com/perses/perses/go-sdk/panel/bar" 

bar.WithMode(bar.PercentageMode)
```

Define the chart mode.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/dashboard"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/panel/bar"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.AddPanel("Container memory",
				bar.Chart(
					bar.Calculation(common.LastCalculation),
					bar.Format(common.Format{
						Unit: common.BytesUnit,
					}),
					bar.SortingBy(bar.AscSort),
					bar.WithMode(bar.PercentageMode),
				),
			),
		),
	)
}
```