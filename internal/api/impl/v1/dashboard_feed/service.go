package dashboard_feed

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/interface/v1/dashboard_feed"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/variable"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	prometheusAPI "github.com/prometheus/client_golang/api"
	prometheusAPIV1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

func prometheusQuery(variables map[string]string, query string, duration model.Duration, promClient prometheusAPIV1.API) func() interface{} {
	return func() interface{} {
		q := variable.ReplaceVariableByValue(variables, query)
		end := time.Now()
		start := end.Add(-time.Duration(duration))
		logrus.Debugf("performing the http request with the query '%s'", q)
		result, _, err := promClient.QueryRange(context.Background(), q, prometheusAPIV1.Range{
			Start: start,
			End:   end,
			Step:  time.Minute,
		})
		return &v1.PromQueryResult{
			Err:    err,
			Result: result,
		}
	}
}

func newPrometheusClient(url *url.URL) (prometheusAPIV1.API, error) {
	promClient, err := prometheusAPI.NewClient(prometheusAPI.Config{
		Address: url.String(),
	})
	if err != nil {
		return nil, err
	}
	return prometheusAPIV1.NewAPI(promClient), nil
}

func NewService(datasourceService datasource.Service) dashboard_feed.Service {
	return &service{datasourceService: datasourceService}
}

type service struct {
	dashboard_feed.Service
	datasourceService datasource.Service
}

func (s *service) FeedVariable(request *v1.VariableFeedRequest) ([]v1.VariableFeedResponse, error) {
	promClient, err := s.buildPromClient(request.Datasource)
	if err != nil {
		return nil, err
	}

	if request.SelectedVariables == nil {
		// In case the map request.SelectedVariables is not initialized, let's create it.
		// It will be used later to replace the different variable by its value stored in this map.
		request.SelectedVariables = make(map[string]string)
	}

	var result = make([]v1.VariableFeedResponse, 0, len(request.Variables))
	// determinate the build order
	groups, err := variable.BuildOrder(request.Variables)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", shared.BadRequestError, err)
	}
	for _, group := range groups {
		// Each variable contains in a single group can be built in parallel.
		groupAsynchronousRequests := make([]async.Future, 0, len(group.Variables))
		for _, name := range group.Variables {
			// In case the variable has a value in the map request.SelectedVariables,
			// then we don't need to calculate it.
			if _, ok := request.SelectedVariables[name]; ok {
				continue
			}
			// Last easy case, if the variable is a ConstantVariable,
			// then we just have to take one value from the defined values
			currentVariable := request.Variables[name]
			if parameter, ok := currentVariable.Parameter.(*v1.ConstantVariableParameter); ok {
				// It would be a bit weird that a constant variable doesn't have a selected value in the map.
				// But we have to take in count this case ... So let see if there is a predefined value in the field `selected`.
				// Otherwise let's take the first value for the values
				value := currentVariable.Selected
				if len(currentVariable.Selected) == 0 {
					value = parameter.Values[0]
				}
				// then set this value into the map. So it can be used later for others variables that could depend on this one.
				request.SelectedVariables[name] = value
				continue
			}
			// So here the variable is a query and so we need to execute it to determinate its value.
			// It's worth to execute it in a dedicated go routine.
			groupAsynchronousRequests = append(groupAsynchronousRequests,
				async.Async(func(variableName string) func() interface{} {
					return func() interface{} {
						return variable.Execute(request, variableName, promClient)
					}
				}(name)),
			)
			errorOccurred := false
			for _, asyncRequest := range groupAsynchronousRequests {
				// wait every asynchronous execution and then set a value into the map
				response := asyncRequest.Await().(*v1.VariableFeedResponse)
				if response.Err != nil {
					// if an error occurred when calculating the variable, we should stop to calculate them.
					// Likely we won't be able to calculate the next group since it depends of the current one.
					logrus.WithError(err).Debugf("an error occurred when executing the query for the variable '%s'", response.Name)
					errorOccurred = true
				} else if len(response.Values) > 0 {
					// if there is no value, then there is no reason to take the value from the one selected by default.
					value := response.Values[0]
					request.SelectedVariables[name] = value
					response.Selected = value
				}
				result = append(result, *response)
			}
			if errorOccurred {
				logrus.Debug("aborting calculation of the variable since an error occurred")
				return result, nil
			}
		}
	}
	return result, nil
}

func (s *service) FeedSection(sectionRequest *v1.SectionFeedRequest) ([]v1.SectionFeedResponse, error) {
	promClient, err := s.buildPromClient(sectionRequest.Datasource)
	if err != nil {
		return nil, err
	}

	var sectionResponses = make([]v1.SectionFeedResponse, 0, len(sectionRequest.Sections))
	for _, section := range sectionRequest.Sections {
		currentSectionResponse := v1.SectionFeedResponse{
			Name:  section.Name,
			Order: section.Order,
		}
		panelAsynchronousRequests := make([]async.Future, 0, len(section.Panels))
		for _, panel := range section.Panels {
			panelAsynchronousRequests = append(panelAsynchronousRequests,
				async.Async(func(currentPanel v1.Panel) func() interface{} {
					return func() interface{} {
						switch chart := panel.Chart.(type) {
						case *v1.LineChart:
							return s.feedLineChart(sectionRequest, panel, chart, promClient)
						default:
							return fmt.Errorf("this chart '%T' is not supported", chart)
						}
					}
				}(panel)))
		}
		for _, request := range panelAsynchronousRequests {
			object := request.Await()
			if panelErr, ok := object.(error); ok {
				logrus.WithError(panelErr)
				continue
			}
			currentSectionResponse.Panels = append(currentSectionResponse.Panels, *object.(*v1.PanelFeedResponse))
		}
		sectionResponses = append(sectionResponses, currentSectionResponse)
	}
	return sectionResponses, nil
}

func (s *service) feedLineChart(sectionRequest *v1.SectionFeedRequest, currentPanel v1.Panel, chart *v1.LineChart, promClient prometheusAPIV1.API) *v1.PanelFeedResponse {
	panelAnswer := &v1.PanelFeedResponse{
		Name:  currentPanel.Name,
		Order: currentPanel.Order,
	}
	asynchronousRequests := make([]async.Future, 0, len(chart.Lines))
	for _, line := range chart.Lines {
		asynchronousRequests = append(asynchronousRequests,
			async.Async(prometheusQuery(sectionRequest.Variables, line.Expr, sectionRequest.Duration, promClient)),
		)
	}

	for _, request := range asynchronousRequests {
		object := request.Await()
		queryResult := object.(*v1.PromQueryResult)
		if queryResult.Err != nil {
			logrus.WithError(queryResult.Err).Error("Error occurred when contacting the prometheus server")
		}
		panelAnswer.Results = append(panelAnswer.Results, *queryResult)
	}
	return panelAnswer
}

func (s *service) buildPromClient(datasource string) (prometheusAPIV1.API, error) {
	dtsObject, err := s.datasourceService.Get(shared.Parameters{Name: datasource})
	if err != nil {
		if errors.Is(err, shared.NotFoundError) {
			return nil, fmt.Errorf("%w: datasource '%s' doesn't exist", shared.BadRequestError, datasource)
		}
	}
	dts := dtsObject.(*v1.Datasource)
	promClient, err := newPrometheusClient(dts.Spec.URL)
	if err != nil {
		logrus.WithError(err).Errorf("unable to create the prometheus client with the url '%s'", dts.Spec.URL)
		return nil, shared.InternalError
	}
	return promClient, nil
}
