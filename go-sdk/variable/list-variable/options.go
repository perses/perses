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
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/variable"
)

func DefaultValue(value string) Option {
	return func(builder *Builder) error {
		builder.DefaultValue = &variable.DefaultValue{
			SingleValue: value,
		}
		return nil
	}
}

func DefaultValues(values ...string) Option {
	return func(builder *Builder) error {
		builder.DefaultValue = &variable.DefaultValue{
			SliceValues: values,
		}
		return nil
	}
}

func AllowAllValues(isAllValueAllowed bool) Option {
	return func(builder *Builder) error {
		builder.AllowAllValue = isAllValueAllowed
		return nil
	}
}

func AllowMultiple(isMultipleValuesAllowed bool) Option {
	return func(builder *Builder) error {
		builder.AllowMultiple = isMultipleValuesAllowed
		return nil
	}
}

func CustomAllValue(value string) Option {
	return func(builder *Builder) error {
		builder.CustomAllValue = value
		return nil
	}
}

func CapturingRegexp(regexp string) Option {
	return func(builder *Builder) error {
		builder.CapturingRegexp = regexp
		return nil
	}
}

func SortingBy(sort variable.Sort) Option {
	return func(builder *Builder) error {
		builder.Sort = &sort
		return nil
	}
}

func Plugin(plugin common.Plugin) Option {
	return func(builder *Builder) error {
		builder.Plugin = plugin
		return nil
	}
}

func Description(description string) Option {
	return func(builder *Builder) error {
		if builder.Display == nil {
			builder.Display = &variable.Display{}
		}
		builder.Display.Description = description
		return nil
	}
}

func DisplayName(displayName string) Option {
	return func(builder *Builder) error {
		if builder.Display == nil {
			builder.Display = &variable.Display{}
		}
		builder.Display.Name = displayName
		return nil
	}
}

func Hidden(isHidden bool) Option {
	return func(builder *Builder) error {
		if builder.Display == nil {
			builder.Display = &variable.Display{}
		}
		builder.Display.Hidden = isHidden
		return nil
	}
}
