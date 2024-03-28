# Label-Values Variable Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/prometheus/label-values"

var options []labelvalues.Option
labelvalues.PrometheusLabelValues("my_super_label_name", options...)
```

Need to provide a label name and a list of options.

## Default options

- [LabelName()](#labelname): with the label name provided in the constructor.

## Available options

### LabelName

```golang
import "github.com/perses/perses/go-sdk/prometheus/label-values" 

labelvalues.LabelName("my_super_label_name")
```

Define the label name where value will be retrieved.

### Matchers

```golang
import "github.com/perses/perses/go-sdk/prometheus/label-values" 

var matchers []string
labelvalues.Matchers(matchers...)
```

Define matchers filtering the result.

### AddMatcher

```golang
import "github.com/perses/perses/go-sdk/prometheus/label-values"

labelvalues.AddMatcher("my_super_matcher")
```

Define a matcher filtering the result.

### Datasource

```golang
import "github.com/perses/perses/go-sdk/prometheus/label-values"

labelvalues.Datasource("datasourceValue")
```

Define the datasource where the expression will be executed.

### Filter

```golang
import "github.com/perses/perses/go-sdk/variable" 

variable.Filter(variables...)
```

Mainly used by [variable group](../../variable-group.md). It will filter the current variable with the provided variables.
The filter will be applied only if matchers don't have curly brackets.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	labelvalues "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	listvariable "github.com/perses/perses/go-sdk/variable/list-variable"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddVariable("stack",
			listvariable.List(
				labelvalues.PrometheusLabelValues("stack",
					labelvalues.Matchers("thanos_build_info{}"),
					labelvalues.Datasource("prometheusDemo"),
				),
				listvariable.DisplayName("PaaS"),
			),
		),
	)
}
```
