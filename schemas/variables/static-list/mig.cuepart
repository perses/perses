if #var.type == "custom" || #var.type == "interval" {
    kind: "StaticListVariable"
    spec: {
        values: [ for _, option in #var.options if option.value !~ "^\\$__.*$" { // the if filters out the grafana global vars that'd be causing validation issues later (e.g "__auto_interval_sampling is used but not defined")
            option.value
        }]
    }
},
