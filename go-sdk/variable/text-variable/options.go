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

package text_variable

import (
	"github.com/perses/perses/pkg/model/api/v1/variable"
)

func Value(value string) Option {
	return func(builder *Builder) error {
		builder.Value = value
		return nil
	}
}

func Constant(isConstant bool) Option {
	return func(builder *Builder) error {
		builder.Constant = isConstant
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
