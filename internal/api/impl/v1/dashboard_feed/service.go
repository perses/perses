package dashboard_feed

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/interface/v1/dashboard_feed"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	prometheusAPI "github.com/prometheus/client_golang/api"
	prometheusAPIV1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

func prometheusQuery(variables map[string]string, query string, duration model.Duration, promClient prometheusAPIV1.API) func() interface{} {
	return func() interface{} {
		q := query
		for k, v := range variables {
			q = strings.Replace(q, fmt.Sprintf("$%s", k), v, -1)
		}
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

func (s *service) FeedSection(sectionRequest *v1.SectionFeedRequest) ([]v1.SectionFeedResponse, error) {
	dtsObject, err := s.datasourceService.Get(shared.Parameters{Name: sectionRequest.Datasource})
	if err != nil {
		if errors.Is(err, shared.NotFoundError) {
			return nil, fmt.Errorf("%w: datasource '%s' doesn't exist", shared.BadRequestError, sectionRequest.Datasource)
		}
	}
	dts := dtsObject.(*v1.Datasource)
	promClient, err := newPrometheusClient(dts.Spec.URL)
	if err != nil {
		logrus.WithError(err).Errorf("unable to create the prometheus client with the url '%s'", dts.Spec.URL)
		return nil, shared.InternalError
	}

	var sectionResponses []v1.SectionFeedResponse
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
