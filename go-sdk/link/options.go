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

package link

import (
	"fmt"
	"strings"
)

func URL(url string) Option {
	return func(builder *Builder) error {
		if len(builder.Tags) > 0 {
			return fmt.Errorf("link cannot set both a url and tags")
		}
		builder.URL = url
		return nil
	}
}

func Tags(tags []string) Option {
	return func(builder *Builder) error {
		if builder.URL != "" {
			return fmt.Errorf("link cannot set both a url and tags")
		}
		cleaned, err := cleanTags(tags)
		if err != nil {
			return err
		}
		builder.Tags = cleaned
		return nil
	}
}

func KeepTime(keepTime bool) Option {
	return func(builder *Builder) error {
		builder.KeepTime = keepTime
		return nil
	}
}

func IncludeVariables(includeVariables bool) Option {
	return func(builder *Builder) error {
		builder.IncludeVariables = includeVariables
		return nil
	}
}

func cleanTags(tags []string) ([]string, error) {
	cleaned := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			return nil, fmt.Errorf("link tag must not be empty")
		}
		cleaned = append(cleaned, tag)
	}
	if len(cleaned) == 0 {
		return nil, fmt.Errorf("link requires at least one tag")
	}
	return cleaned, nil
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
