# Variable

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
Mainly used by variable group. It will filter the current variable with the provided variables.
The filter implementation is defined by the variable plugin builder.


## Spec Options

### Text Variable

#### Text Variable Constructor

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

var txtVarOptions []txtVar.Option
txtVar.Text("example-value", txtVarOptions...)
```


#### Text Variable Options

##### Value

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Value("example-value")
```
Define the value of the text variable.


##### Constant

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Constant(true)
```
Define if the text variable is a constant. A constant variable is a variable that can't be changed by the user on the dashboard.


##### Description

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Description("This is a super description")
```
Set the description of the text variable.


##### DisplayName

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.DisplayName("This is a super description")
```
Set the display name of the text variable.


##### Hidden

```golang
txtVar "github.com/perses/perses/go-sdk/variable/text-variable"

txtVar.Hidden(true)
```
Define if the text variable is hidden. A hidden variable is a variable that is not displayed on the dashboard.


### List Variable

#### List Variable Constructor

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

var listVarOptions []listVar.Option
listVar.List(listVarOptions...)
```


#### List Variable Options

##### DefaultValue

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.DefaultValue("example-value")
```
Define a single default value for the list variable.


##### AllowAllValue

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.AllowAllValue(true)
```
Define if the "all" value is allowed. If set to true, the list variable will have an "all" option that will select all values for the variable.


##### AllowMultiple

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.AllowMultiple("This is a super description")
```
Define if the list variable allows multiple values to be selected. If set to true, the list variable will allow multiple values to be selected by the user on the dashboard.


##### CustomAllValue

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.CustomAllValue("MySuperAllValueCustom")
```
Define a custom value for the "all" option.


##### CapturingRegexp

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.CapturingRegexp("^mysuperregexp.*")
```
Define a capturing regexp for the list variable. It will only list the values that match the regexp.

##### SortingBy

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.SortingBy(listVar.SortingAlphabeticalAsc)
```
Define the sorting order of the list variable. 
The available options are: "none", "alphabetical-asc", "alphabetical-desc", "numerical-asc", "numerical-desc", "alphabetical-ci-asc" and "alphabetical-ci-desc".


##### Description

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.Description("This is a super description")
```
Set the description of the list variable.


##### DisplayName

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.DisplayName("This is a super description")
```
Set the display name of the list variable.


##### Hidden

```golang
listVar "github.com/perses/perses/go-sdk/variable/text-variable"

listVar.Hidden(true)
```
Define if the list variable is hidden. A hidden variable is a variable that is not displayed on the dashboard.


#### Variable Plugin Options

##### Prometheus (List Variable)

```golang
promqlVar "github.com/perses/perses/go-sdk/prometheus/variable/promql"

var promqlVarOptions []promqlVar.Option
promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{})", promqlVarOptions...)
```
Use a Prometheus query to populate the list variable. More info at [PromQL Variable](./prometheus/variable/promql.md).


##### Prometheus Label Name (List Variable)

```golang
labelNamesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-names"

var labelNamesVarOptions []labelNamesVar.Option
labelNamesVar.PrometheusLabelNames(labelNamesVarOptions...)
```
Use label names from a Prometheus datasource to populate the list variable. More info at [Label Names Variable](./prometheus/variable/label-names.md).


##### Prometheus Label Values (List Variable)

```golang
labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"

var labelValuesVarOptions []labelValuesVar.Option
labelValuesVar.PrometheusLabelValues("labelNames", labelNamesVarOptions...)
```
Use label values from a Prometheus datasource to populate the list variable. More info at [Label Values Variable](./prometheus/variable/label-values.md).