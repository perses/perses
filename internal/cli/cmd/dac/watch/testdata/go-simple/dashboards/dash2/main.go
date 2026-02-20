package main

import (
	"test-dac.com/m/mylibrary"
)

func main() {
	// Dashboard 2 also imports mylibrary
	_ = mylibrary.GetValue()
}
