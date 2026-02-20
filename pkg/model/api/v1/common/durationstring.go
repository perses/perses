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

package common

import "encoding/json"

// DurationString is a string that represents a duration, such as "1h", "30m", "15s", etc.
// It is used to unmarshal a duration string from JSON or YAML, and validate that it is a valid duration string.
//
// Not converting the duration string into a time.Duration type allows us to avoid the issue of changing the initial input with an alias.
// This is something that happens when we use Duration type, because when the duration is unmarshalled then marshaled again, the input can be changed with an equivalent duration.
// For example "14d" will be changed to "2w".
//
// So, use DurationString instead of Duration when you want to preserve the original input string.
// If, for any reason, you need to convert the DurationString to a time.Duration, you can use the ParseDuration function.
//
// +kubebuilder:validation:Type=string
// +kubebuilder:validation:Format=duration
// +kubebuilder:validation:Pattern=`^(([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?$`
type DurationString string

func (d *DurationString) UnmarshalJSON(bytes []byte) error {
	var tmp DurationString
	type plain DurationString
	if err := json.Unmarshal(bytes, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := tmp.validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DurationString) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp DurationString
	type plain DurationString
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := tmp.validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DurationString) validate() error {
	if len(*d) == 0 {
		return nil
	}
	_, err := ParseDuration(string(*d))
	return err
}
