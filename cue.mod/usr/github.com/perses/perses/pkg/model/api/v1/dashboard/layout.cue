// Copyright 2023 The Perses Authors
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

package dashboard

import "github.com/perses/perses/pkg/model/api/v1/common"

#GridItem: {
	x:       int             @go(X)
	y:       int             @go(Y)
	width:   int             @go(Width)
	height:  int             @go(Height)
	content: common.#JSONRef @go(Content)
}

#GridLayoutCollapse: {
	open: bool @go(Open)
}

#GridLayoutDisplay: {
	title:     string              @go(Title)
	collapse?: #GridLayoutCollapse @go(Collapse)
}

#GridLayoutSpec: {
	display: #GridLayoutDisplay @go(Title)
	items?:  [...#GridItem]     @go(Items,[]GridItem)
}

#LayoutKind: "Grid"

#LayoutSpec: #GridLayoutSpec

#Layout: {
	kind: #LayoutKind @go(Kind)
    spec: #LayoutSpec @go(Spec)
}
