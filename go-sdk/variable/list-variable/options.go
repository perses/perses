// Copyright 2024 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package listvariable

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/variable"
)

func DefaultValue(value string) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.DefaultValue = &variable.DefaultValue{
			SingleValue: value,
		}
		return nil
	}
}

func DefaultValues(values ...string) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.DefaultValue = &variable.DefaultValue{
			SliceValues: values,
		}
		return nil
	}
}

func AllowAllValues(isAllValueAllowed bool) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.AllowAllValue = isAllValueAllowed
		return nil
	}
}

func AllowMultiple(isMultipleValuesAllowed bool) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.AllowMultiple = isMultipleValuesAllowed
		return nil
	}
}

func CustomAllValue(value string) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.CustomAllValue = value
		return nil
	}
}

func CapturingRegexp(regexp string) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.CapturingRegexp = regexp
		return nil
	}
}

func SortingBy(sort variable.Sort) Option {
	return func(builder *Builder) error {
		builder.ListVariableSpec.Sort = &sort
		return nil
	}
}

func Description(description string) Option {
	return func(builder *Builder) error {
		if builder.ListVariableSpec.Display == nil {
			builder.ListVariableSpec.Display = &variable.Display{}
		}
		builder.ListVariableSpec.Display.Description = description
		return nil
	}
}

func DisplayName(displayName string) Option {
	return func(builder *Builder) error {
		if builder.ListVariableSpec.Display == nil {
			builder.ListVariableSpec.Display = &variable.Display{}
		}
		builder.ListVariableSpec.Display.Name = displayName
		return nil
	}
}

func Hidden(isHidden bool) Option {
	return func(builder *Builder) error {
		if builder.ListVariableSpec.Display == nil {
			builder.ListVariableSpec.Display = &variable.Display{}
		}
		builder.ListVariableSpec.Display.Hidden = isHidden
		return nil
	}
}

func Filter(variables ...v1.Variable) Option {
	return func(builder *Builder) error {
		builder.Filters = variables
		return nil
	}
}
