// NB: Convert text panels with mode=html as markdown panels as best effort while we dont provide a proper panel type for this
if (*#panel.type | null) == "text" {
	if #panel.mode != _|_ {
		kind: "Markdown"
		spec: {
			text: #panel.content
		}
	}
	if #panel.options != _|_ {
		kind: "Markdown"
		spec: {
			text: #panel.options.content
		}
	}
},
