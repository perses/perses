// Copyright The Perses Authors
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

package annotation

import (
	"errors"

	"github.com/perses/spec/go/plugin"
)

// Name sets the annotation display name.
func Name(name string) Option {
	return func(builder *Builder) error {
		if name == "" {
			return errors.New("annotation name cannot be empty")
		}
		builder.Annotation.Display.Name = name
		return nil
	}
}

// Description sets the annotation description.
func Description(description string) Option {
	return func(builder *Builder) error {
		builder.Annotation.Display.Description = description
		return nil
	}
}

// Hidden controls whether the annotation is initially hidden.
func Hidden(hidden bool) Option {
	return func(builder *Builder) error {
		builder.Annotation.Display.Hidden = hidden
		return nil
	}
}

// Color sets the annotation display color.
func Color(color string) Option {
	return func(builder *Builder) error {
		builder.Annotation.Display.Color = color
		return nil
	}
}

// Plugin sets the annotation plugin configuration.
func Plugin(plg plugin.Plugin) Option {
	return func(builder *Builder) error {
		builder.Annotation.Plugin = plg
		return nil
	}
}
