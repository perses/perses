package variable

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
	prometheusAPIV1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

func Execute(request *v1.VariableFeedRequest, variableName string, promClient prometheusAPIV1.API) *v1.VariableFeedResponse {
	return &v1.VariableFeedResponse{
		Name:   variableName,
		Values: nil,
		Err:    nil,
	}
}
