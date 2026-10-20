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

#url: {
	name?:            string
	url:              string
	tooltip?:         string
	renderVariables?: bool | *true
	targetBlank?:     bool | *false
}

#tags: {
	name:              string
	tags:              [...string] & [_, ...]
	tooltip?:          string
	keepTime?:         bool | *false
	includeVariables?: bool | *false
}

#build: #url | #tags
