// Copyright 2025 The Perses Authors
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

package start

import (
	"math"
	"math/rand/v2"

	"github.com/fatih/color"
	"github.com/redbo/gohsv"
)

const goldenRatioConjugate = 0.618033988749895

func generateColors(n int) []*color.Color {
	var result []*color.Color
	h := rand.Float64() + goldenRatioConjugate
	h = math.Mod(h, 1.0)
	for i := 0; i < n; i++ {
		r, g, b := gohsv.HSVtoRGB(rand.Float64()*360, 0.5, 0.95)
		result = append(result, color.RGB(int(r), int(g), int(b)))
	}
	return result
}
