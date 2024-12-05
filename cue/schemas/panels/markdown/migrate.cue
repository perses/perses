// NB: Convert text panels with mode=html as markdown panels as best effort while we dont provide a proper panel type for this
if (*#panel.type | null) == "text" {
	kind: "Markdown"
	if #panel.mode != _|_ {
		spec: {
			text: #panel.content
		}
	}
	if #panel.options != _|_ {
		spec: {
			text: #panel.options.content
		}
	}
	if #panel.options == _|_ && #panel.mode == _|_ {
		spec: {
			text: ""
		}
	}
}
