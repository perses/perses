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

package link

func URL(url string) Option {
	return func(builder *Builder) error {
		builder.URL = url
		return nil
	}
}

func Name(name string) Option {
	return func(builder *Builder) error {
		builder.Name = name
		return nil
	}
}

func Tooltip(tooltip string) Option {
	return func(builder *Builder) error {
		builder.Tooltip = tooltip
		return nil
	}
}

func RenderVariable(isRenderingVariable bool) Option {
	return func(builder *Builder) error {
		builder.RenderVariables = isRenderingVariable
		return nil
	}
}

func TargetBlank(isTargetingBlank bool) Option {
	return func(builder *Builder) error {
		builder.TargetBlank = isTargetingBlank
		return nil
	}
}
