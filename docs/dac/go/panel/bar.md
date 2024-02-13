# Bar

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
