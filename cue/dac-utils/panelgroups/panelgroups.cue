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

// This package offers an utility to build a set of panel groups easily.

package panelgroups

import (
	panelGroupBuilder "github.com/perses/perses/cue/dac-utils/panelgroup"
)

// expected user input
#input: [...panelGroupBuilder]

// output: the same panel groups but as a map + with #groupIndex parameter populated.
// NB: the goal of transforming the array into a map is just to be able to manipulate
// the panel groups directly from the root of this package; indeed returning a list
// would prevent from accessing the result directly from the root ("conflicting list
// & struct")
[string]: panelGroupBuilder

{for i, pgb in #input {
	"\(i)": pgb & {#groupIndex: i}
}}
