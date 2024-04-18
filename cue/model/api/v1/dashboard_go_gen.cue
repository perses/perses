// Code generated by cue get go. DO NOT EDIT.

//cue:generate cue get go github.com/perses/perses/pkg/model/api/v1

package v1

import "github.com/perses/perses/cue/model/api/v1/common"

#Link: {
	name?:            string @go(Name)
	url:              string @go(URL)
	tooltip?:         string @go(Tooltip)
	renderVariables?: bool   @go(RenderVariables)
	targetBlank?:     bool   @go(TargetBlank)
}

#PanelDisplay: _

#PanelSpec: {
	display: #PanelDisplay  @go(Display)
	plugin:  common.#Plugin @go(Plugin)
	queries?: [...#Query] @go(Queries,[]Query)
}

#Panel: {
	kind: string     @go(Kind)
	spec: #PanelSpec @go(Spec)
}

#Query: {
	kind: string     @go(Kind)
	spec: #QuerySpec @go(Spec)
}

#QuerySpec: {
	plugin: common.#Plugin @go(Plugin)
}

#DashboardSpec: _

#Dashboard: _
