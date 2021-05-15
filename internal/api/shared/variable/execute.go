package variable

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	prometheusAPIV1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

func buildStartEndTime(duration model.Duration) (time.Time, time.Time) {
	end := time.Now()
	start := end.Add(-time.Duration(duration))
	return start, end
}

func capturingMatrix(matrix model.Matrix, filter v1.PromQLQueryFilter) []string {
	capturedData := make(map[string]bool)
	for _, sample := range matrix {
		if value, ok := sample.Metric[model.LabelName(filter.LabelName)]; ok {
			fillingCapturedData(string(value), capturedData, filter.CapturingRegexp.GetRegexp())
		}
	}
	return capturedDataToList(capturedData)
}

func capturingLabelName(labelNames []string, reg *regexp.Regexp) []string {
	capturedData := make(map[string]bool)
	for _, label := range labelNames {
		fillingCapturedData(label, capturedData, reg)
	}
	return capturedDataToList(capturedData)
}

func capturingLabelValue(labelValues model.LabelValues, reg *regexp.Regexp) []string {
	capturedData := make(map[string]bool)
	for _, label := range labelValues {
		fillingCapturedData(string(label), capturedData, reg)
	}
	return capturedDataToList(capturedData)
}

func fillingCapturedData(label string, capturedData map[string]bool, reg *regexp.Regexp) {
	matches := reg.FindAllStringSubmatch(label, -1)
	for _, match := range matches {
		for i := 1; i < len(match); i++ {
			capturedData[match[i]] = true
		}
	}
}

func capturedDataToList(capturedData map[string]bool) []string {
	result := make([]string, 0, len(capturedData))
	for label := range capturedData {
		result = append(result, label)
	}
	return result
}

func ReplaceVariableByValue(variables map[string]string, word string) string {
	w := word
	for k, v := range variables {
		w = strings.Replace(w, fmt.Sprintf("$%s", k), v, -1)
	}
	return w
}

func Execute(request *v1.VariableFeedRequest, variableName string, promClient prometheusAPIV1.API) *v1.VariableFeedResponse {
	q := &query{
		request:    request,
		name:       variableName,
		promClient: promClient,
	}

	switch parameter := request.Variables[variableName].Parameter.(type) {
	case *v1.LabelNamesQueryVariableParameter:
		return q.LabelNames(parameter)
	case *v1.LabelValuesQueryVariableParameter:
		return q.LabelValues(parameter)
	case *v1.PromQLQueryVariableParameter:
		return q.PromQLQuery(parameter)
	default:
		return &v1.VariableFeedResponse{
			Name:   variableName,
			Values: make([]string, 0, 0),
			Err:    fmt.Errorf("parameter of type %T is not managed", parameter),
		}
	}
}

type query struct {
	request    *v1.VariableFeedRequest
	name       string
	promClient prometheusAPIV1.API
}

func (q *query) PromQLQuery(parameter *v1.PromQLQueryVariableParameter) *v1.VariableFeedResponse {
	start, end := buildStartEndTime(q.request.Duration)
	result, _, err := q.promClient.QueryRange(context.Background(),
		ReplaceVariableByValue(q.request.SelectedVariables, parameter.Expr),
		prometheusAPIV1.Range{
			Start: start,
			End:   end,
			Step:  time.Minute,
		})
	if err != nil {
		logrus.WithError(err).Error("unable to get the list of the label values")
		return &v1.VariableFeedResponse{
			Name:   q.name,
			Values: make([]string, 0, 0),
			Err:    err,
		}
	}
	if matrix, ok := result.(model.Matrix); ok {
		return &v1.VariableFeedResponse{
			Name:   q.name,
			Values: capturingMatrix(matrix, parameter.Filter),
		}
	}
	return &v1.VariableFeedResponse{
		Name:   q.name,
		Values: make([]string, 0, 0),
		Err:    fmt.Errorf("'%T' is not managed", result),
	}
}

func (q *query) LabelValues(parameter *v1.LabelValuesQueryVariableParameter) *v1.VariableFeedResponse {
	start, end := buildStartEndTime(q.request.Duration)
	for i := 0; i < len(parameter.Matchers); i++ {
		parameter.Matchers[i] = ReplaceVariableByValue(q.request.SelectedVariables, parameter.Matchers[i])
	}
	labelValues, _, err := q.promClient.LabelValues(context.Background(), ReplaceVariableByValue(q.request.SelectedVariables, parameter.LabelName), parameter.Matchers, start, end)
	if err != nil {
		logrus.WithError(err).Error("unable to get the list of the label values")
		return &v1.VariableFeedResponse{
			Name:   q.name,
			Values: make([]string, 0, 0),
			Err:    err,
		}
	}
	return &v1.VariableFeedResponse{
		Name:   q.name,
		Values: capturingLabelValue(labelValues, parameter.CapturingRegexp.GetRegexp()),
	}
}

func (q *query) LabelNames(parameter *v1.LabelNamesQueryVariableParameter) *v1.VariableFeedResponse {
	start, end := buildStartEndTime(q.request.Duration)
	for i := 0; i < len(parameter.Matchers); i++ {
		parameter.Matchers[i] = ReplaceVariableByValue(q.request.SelectedVariables, parameter.Matchers[i])
	}
	labelNames, _, err := q.promClient.LabelNames(context.Background(), parameter.Matchers, start, end)
	if err != nil {
		logrus.WithError(err).Error("unable to get the list of the label name")
		return &v1.VariableFeedResponse{
			Name:   q.name,
			Values: make([]string, 0, 0),
			Err:    err,
		}
	}
	return &v1.VariableFeedResponse{
		Name:   q.name,
		Values: capturingLabelName(labelNames, parameter.CapturingRegexp.GetRegexp()),
	}
}
