package main

import (
	"test-dac.com/m/mylibrary"
)

func main() {
	// Dashboard 1 imports mylibrary directly
	_ = mylibrary.GetValue()
}
