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

package model

// Same pattern as the TimeSeriesChart palette: a comprehension over an undefaulted disjunction in a definition.
kind: "PaletteChart"
spec: close({
	visual?: #visual
})

#palette: {
	mode: "auto" | "categorical"
	if mode == "categorical" {
		name?: "category10" | "tableau10"
	}
}

#visual: {
	palette?: #palette
}
