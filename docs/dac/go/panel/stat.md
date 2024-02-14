# Stat Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel/stat"

var options []stat.Option
stat.Chart(options...)
```

Need a list of options.

## Default options

- Calculation(): last

## Available options

### Calculation

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/stat" 

stat.Calculation(common.Last)
```

Define the chart calculation.

### Format

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/stat" 

stat.Format(common.Format{...})
```

Define the chart format.

### Thresholds

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/stat"

stat.Thresholds(common.Thresholds{...})
```

Define chart thresholds.

### WithSparkline

```golang
import "github.com/perses/perses/go-sdk/panel/stat" 

stat.WithSparkline(stat.Sparkline{...})
```

Define the sparkline of the chart.

### ValueFontSize

```golang
import "github.com/perses/perses/go-sdk/panel/stat" 

stat.ValueFontSize(12)
```

Define the font size of the value.
