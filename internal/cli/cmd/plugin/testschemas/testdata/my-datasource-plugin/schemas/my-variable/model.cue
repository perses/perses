package model

kind: "MyVariable"
spec: close({
	options: [...string] & [_, ...] // At least one option required
	multiSelect: bool | *false
})
