package v1

// Health is the struct that provides the health information of the API
type Health struct {
	BuildTime string `json:"buildTime"`
	Version   string `json:"version"`
	Commit    string `json:"commit"`
	Database  bool   `json:"database"`
}
