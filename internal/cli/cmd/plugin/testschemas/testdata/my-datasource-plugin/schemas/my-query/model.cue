package model

import "strings"

kind: "MyQuery"
spec: close({
	query: strings.MinRunes(1)
})
