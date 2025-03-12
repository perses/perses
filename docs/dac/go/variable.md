# Variable Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/variable"

var options []variable.Option
variable.New("My Super Variable", options...)
```

Need to provide the name of the varaible and a list of options.

## Default options

- [Name()](#name): with the name provided in the constructor.

## Available options

### Name

```golang
import "github.com/perses/perses/go-sdk/variable"

variable.Name("My Super Variable")
```

Define the variable metadata name and the display name.

### Filter

```golang
import "github.com/perses/perses/go-sdk/variable"

variable.Filter(variables...)
```

Mainly used by [variable group](./variable-group.md). It will filter the current variable with the provided variables.
The filter implementation is defined by the variable plugin builder.

## Spec Options

### Text Variable

#### Text Variable Constructor

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

var txtVarOptions []txtVar.Option
txtVar.Text("example-value", txtVarOptions...)
```

#### Text Variable Options

##### Value

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Value("example-value")
```

Define the value of the text variable.

##### Constant

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Constant(true)
```

Define if the text variable is a constant. A constant variable is a variable that can't be changed by the user on the
dashboard.

##### Description

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Description("This is a super description")
```

Set the description of the text variable.

##### DisplayName

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.DisplayName("This is a super description")
```

Set the display name of the text variable.

##### Hidden

```golang
import txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Hidden(true)
```

Define if the text variable is hidden. A hidden variable is a variable that is not displayed on the dashboard.

### List Variable

#### List Variable Constructor

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

var listVarOptions []listVar.Option
listVar.List(listVarOptions...)
```

#### List Variable Options

##### DefaultValue

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.DefaultValue("example-value")
```

Define a single default value for the list variable.

##### AllowAllValue

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.AllowAllValue(true)
```

Define if the "all" value is allowed. If set to true, the list variable will have an "all" option that will select all
values for the variable.

##### AllowMultiple

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.AllowMultiple("This is a super description")
```

Define if the list variable allows multiple values to be selected. If set to true, the list variable will allow multiple
values to be selected by the user on the dashboard.

##### CustomAllValue

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.CustomAllValue("MySuperAllValueCustom")
```

Define a custom value for the "all" option.

##### CapturingRegexp

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.CapturingRegexp("^mysuperregexp.*")
```

Define a capturing regexp for the list variable. It will only list the values that match the regexp.

##### SortingBy

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.SortingBy(listVar.SortingAlphabeticalAsc)
```

Define the sorting order of the list variable.
The available options are: "none", "alphabetical-asc", "alphabetical-desc", "numerical-asc", "numerical-desc", "
alphabetical-ci-asc" and "alphabetical-ci-desc".

##### Description

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.Description("This is a super description")
```

Set the description of the list variable.

##### DisplayName

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.DisplayName("This is a super description")
```

Set the display name of the list variable.

##### Hidden

```golang
import listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.Hidden(true)
```

Define if the list variable is hidden. A hidden variable is a variable not displayed on the dashboard.

#### Variable Plugin Options

See the relative documentation for each variable plugin.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	listvariable "github.com/perses/perses/go-sdk/variable/list-variable"
	labelvalues "github.com/perses/plugins/prometheus/sdk/go/variable/label-values"
)

func main() {
	dashboard.New("ExampleDashboard",
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
