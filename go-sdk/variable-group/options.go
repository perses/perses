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

package variablegroup

import "github.com/perses/perses/go-sdk/variable"

func AddVariable(name string, options ...variable.Option) Option {
	return func(builder *Builder) error {
		options = append([]variable.Option{variable.Filter(builder.FilteringVariables...)}, options...)
		v, err := variable.New(name, options...)
		if err != nil {
			return err
		}

		builder.FilteringVariables = append(builder.FilteringVariables, v.Variable)
		builder.Variables = append(builder.Variables, v.Variable)
		return nil
	}
}

// AddIgnoredVariable adds a variable to the group that will not be added in the filter
// but will still be filtered by the other variables
func AddIgnoredVariable(name string, options ...variable.Option) Option {
	return func(builder *Builder) error {
		options = append([]variable.Option{variable.Filter(builder.FilteringVariables...)}, options...)
		v, err := variable.New(name, options...)
		if err != nil {
			return err
		}

		builder.Variables = append(builder.Variables, v.Variable)
		return nil
	}
}
