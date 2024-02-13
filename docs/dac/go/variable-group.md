# Variable Group

Variable group is a helper for adding variables to a dashboard. 
It will automatically filter the variables added to the group. 
The filter logic is applied by the variable plugin builder.
Variables are filtered by their order in the group: first variable will filter the next ones.
Ignored variables are filtered, but they don't filter the next variables added to the group.

## Constructor

```golang
import "github.com/perses/perses/go-sdk/variable-group"

var options []variablegroup.Option
variablegroup.New(options...)
```
Need a list of options.


## Default options

- None


## Available options

### AddVariable

```golang
import "github.com/perses/perses/go-sdk/variable-group"
import "github.com/perses/perses/go-sdk/variable"

var variableOptions []variable.Option
variablegroup.AddVariable("MySuperVariableName", variableOptions...)
```
Add a variable to the group, this variable will be filtered by variable already present in the group and will filter next variables added.
More info at [Variable](./variable.md).

### AddIgnoredVariable

```golang
import "github.com/perses/perses/go-sdk/variable-group"
import "github.com/perses/perses/go-sdk/variable"

var variableOptions []variable.Option
variablegroup.AddIgnoredVariable("MySuperVariableName", variableOptions...)
```
Add a variable to the group, this variable will be filtered by variable already present in the group. 
However, this variable will not filter next variables added. More info at [Variable](./variable.md).


