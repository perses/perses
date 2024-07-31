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

package model

import "strings"

kind: "Table"
spec: close({
	density?: "compact" | "standard" | "comfortable"
	columnSettings?: [...#columnSettings]
})

#columnSettings: {
	name:               strings.MinRunes(1)
	header?:            string
	headerDescription?: string
	cellDescription?:   string
	align?:             "left" | "center" | "right"
	enableSorting?:     bool
	width?:             number | "auto"
	hide?:              bool
}
