// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package proxy

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/aws/smithy-go"
	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	cwSpec "github.com/perses/spec/go/datasource/proxy/cloudwatch"
	"github.com/perses/spec/go/plugin"
	"github.com/sirupsen/logrus"
	logtest "github.com/sirupsen/logrus/hooks/test"
	"github.com/stretchr/testify/require"
)

type fakeCloudWatch struct {
	metrics   func(*cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error)
	discovery func(*cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error)
}

func (f fakeCloudWatch) GetMetricData(_ context.Context, input *cloudwatch.GetMetricDataInput, _ ...func(*cloudwatch.Options)) (*cloudwatch.GetMetricDataOutput, error) {
	return f.metrics(input)
}

func (f fakeCloudWatch) ListMetrics(_ context.Context, input *cloudwatch.ListMetricsInput, _ ...func(*cloudwatch.Options)) (*cloudwatch.ListMetricsOutput, error) {
	return f.discovery(input)
}

func validCWRequest() cloudWatchRequest {
	return cloudWatchRequest{Action: "GetMetricData", StartTime: time.Now().UTC().Add(-time.Hour), EndTime: time.Now().UTC(), Queries: []cloudWatchQuery{
		{ID: "m1", Metric: &cloudWatchMetric{Namespace: "AWS/EC2", Name: "CPUUtilization", Statistic: "Average", Period: 60}},
	}}
}

func TestCloudWatchPolicy(t *testing.T) {
	const role = "arn:aws:iam::123456789012:role/perses"
	basePolicy := config.CloudWatchConfig{Enable: true, AllowedRegions: []string{"us-east-1"}, AllowedAccounts: []string{"123456789012"}}
	for _, test := range []struct {
		name    string
		policy  func(*config.CloudWatchConfig)
		cfg     func(*cwSpec.Config)
		allowed bool
	}{
		{"disabled", func(p *config.CloudWatchConfig) { p.Enable = false; p.AllowDefaultCredentials = true }, func(*cwSpec.Config) {}, false},
		{"default credentials not allowed", func(*config.CloudWatchConfig) {}, func(*cwSpec.Config) {}, false},
		{"default credentials allowed", func(p *config.CloudWatchConfig) { p.AllowDefaultCredentials = true }, func(*cwSpec.Config) {}, true},
		{"region not allowed", func(p *config.CloudWatchConfig) { p.AllowDefaultCredentials = true }, func(c *cwSpec.Config) { c.Region = "eu-west-1" }, false},
		{"role not allowed", func(*config.CloudWatchConfig) {}, func(c *cwSpec.Config) { c.RoleARN = role }, false},
		{"role allowed", func(p *config.CloudWatchConfig) { p.AllowedRoles = []string{role} }, func(c *cwSpec.Config) { c.RoleARN = role }, true},
		{"role account not allowed", func(p *config.CloudWatchConfig) {
			p.AllowedRoles = []string{role}
			p.AllowedAccounts = []string{"999999999999"}
		}, func(c *cwSpec.Config) { c.RoleARN = role }, false},
		{"malformed role ARN does not panic", func(p *config.CloudWatchConfig) { p.AllowedRoles = []string{"arn:aws"} }, func(c *cwSpec.Config) { c.RoleARN = "arn:aws" }, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			policy := basePolicy
			test.policy(&policy)
			cfg := &cwSpec.Config{Region: "us-east-1"}
			test.cfg(cfg)
			err := validateCloudWatchPolicy(policy, cfg)
			if test.allowed {
				require.NoError(t, err)
				return
			}
			var httpErr *echo.HTTPError
			require.ErrorAs(t, err, &httpErr)
			require.Equal(t, http.StatusForbidden, httpErr.Code)
		})
	}
}

func TestCloudWatchExpressionValidation(t *testing.T) {
	for expression, valid := range map[string]bool{
		"m1 * 2":                              true,
		"IF(m1>0,m1*2,0)":                     true,
		"AVG(m1)":                             true,
		"MAX(ABS(m1))":                        true,
		"SELECT AVG(m1) FROM x":               false,
		"select avg(m1) from x":               false,
		"m1 WHERE m2":                         false,
		"m1 group by x":                       false,
		"m1 Limit 1":                          false,
		"avg(m1)":                             false, // functions are case-sensitive, lower-case ones are rejected on purpose
		"SEARCH(m1)":                          false,
		"SUM(LAMBDA(m1))":                     false,
		"m1 ; m2":                             false,
		"'quoted'":                            false,
		"SUM(m1)" + strings.Repeat(" ", 1100): false,
	} {
		t.Run(expression[:min(len(expression), 30)], func(t *testing.T) {
			require.Equal(t, valid, validCloudWatchExpression(expression))
		})
	}
}

func TestCloudWatchRequestValidation(t *testing.T) {
	for _, test := range []struct {
		name   string
		change func(*cloudWatchRequest)
	}{
		{"write action", func(r *cloudWatchRequest) { r.Action = "PutMetricAlarm" }},
		{"missing queries", func(r *cloudWatchRequest) { r.Queries = nil }},
		{"too many queries", func(r *cloudWatchRequest) { r.Queries = make([]cloudWatchQuery, 21) }},
		{"time range", func(r *cloudWatchRequest) { r.EndTime = r.StartTime.Add(32 * 24 * time.Hour) }},
		{"future", func(r *cloudWatchRequest) { r.EndTime = time.Now().Add(time.Hour) }},
		{"duplicate IDs", func(r *cloudWatchRequest) { r.Queries = append(r.Queries, r.Queries[0]) }},
		{"zero period", func(r *cloudWatchRequest) { r.Queries[0].Metric.Period = 0 }},
		{"search", func(r *cloudWatchRequest) { r.Queries[0].Metric = nil; r.Queries[0].Expression = "SEARCH(m1)" }},
		{"external lambda", func(r *cloudWatchRequest) { r.Queries[0].Metric = nil; r.Queries[0].Expression = "LAMBDA(m1)" }},
		{"unsupported statistics", func(r *cloudWatchRequest) { r.Queries[0].Metric.Statistic = "bad" }},
	} {
		t.Run(test.name, func(t *testing.T) {
			request := validCWRequest()
			require.NoError(t, request.validate(time.Now()))
			test.change(&request)
			require.Error(t, request.validate(time.Now()))
		})
	}
	request := validCWRequest()
	request.Queries = append(request.Queries, cloudWatchQuery{ID: "e1", Expression: "IF(m1>0,m1*2,0)"})
	require.NoError(t, request.validate(time.Now()))
}

func TestCloudWatchPagination(t *testing.T) {
	request := validCWRequest()
	calls := 0
	client := fakeCloudWatch{metrics: func(input *cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error) {
		calls++
		require.Equal(t, types.ScanByTimestampAscending, input.ScanBy)
		require.Equal(t, int32(cloudWatchMaxPoints), *input.MaxDatapoints)
		output := &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{
			Id: aws.String("m1"), StatusCode: types.StatusCodeComplete, Values: []float64{float64(calls)},
			Timestamps: []time.Time{request.StartTime.Add(time.Duration(calls) * time.Minute)},
		}}}
		if calls == 1 {
			output.NextToken = aws.String("next")
			output.MetricDataResults[0].StatusCode = types.StatusCodePartialData
		} else {
			require.Equal(t, "next", *input.NextToken)
		}
		return output, nil
	}}
	result, err := executeCloudWatchMetrics(context.Background(), client, request)
	require.NoError(t, err)
	data, err := json.Marshal(result)
	require.NoError(t, err)
	require.Contains(t, string(data), `"Values":[1,2]`)
	require.Contains(t, string(data), `"StatusCode":"Complete"`)
	require.Equal(t, 2, calls)
}

func TestCloudWatchRejectsIncompleteResults(t *testing.T) {
	request := validCWRequest()
	for _, test := range []struct {
		name   string
		output *cloudwatch.GetMetricDataOutput
	}{
		{"nil", nil},
		{"missing", &cloudwatch.GetMetricDataOutput{}},
		{"partial", &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{Id: aws.String("m1"), StatusCode: types.StatusCodePartialData}}}},
		{"denied", &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{Id: aws.String("m1"), StatusCode: types.StatusCodeForbidden}}}},
		{"unknown ID", &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{Id: aws.String("unexpected"), StatusCode: types.StatusCodeComplete}}}},
		{"mismatched values", &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{Id: aws.String("m1"), StatusCode: types.StatusCodeComplete, Values: []float64{1}}}}},
		{"messages", &cloudwatch.GetMetricDataOutput{Messages: []types.MessageData{{Code: aws.String("MaxMetricsExceeded")}}}},
		{"repeated page", &cloudwatch.GetMetricDataOutput{NextToken: aws.String("same")}},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := fakeCloudWatch{metrics: func(*cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error) { return test.output, nil }}
			_, err := executeCloudWatchMetrics(context.Background(), client, request)
			require.Error(t, err)
		})
	}
}

func TestCloudWatchServe(t *testing.T) {
	p := &cloudWatchProxy{config: &cwSpec.Config{Region: "us-east-1"}, policy: config.CloudWatchConfig{
		Enable: true, AllowDefaultCredentials: true, AllowedRegions: []string{"us-east-1"}, AllowedAccounts: []string{"123456789012"},
	}, testClient: fakeCloudWatch{discovery: func(input *cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
		require.Equal(t, "AWS/EC2", aws.ToString(input.Namespace))
		return nil, errors.New("secret access key MUST NOT LEAK")
	}}}
	for _, body := range []string{
		`{"action":"ListMetrics","namespace":"AWS/EC2","endpoint":"http://localhost"}`,
		`{"action":"ListMetrics","namespace":"AWS/EC2"} {}`,
		`{"action":"ListMetrics","namespace":"` + strings.Repeat("x", cloudWatchMaxBody) + `"}`,
	} {
		c := echo.New().NewContext(httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)), httptest.NewRecorder())
		err := p.serve(c)
		var httpErr *echo.HTTPError
		require.ErrorAs(t, err, &httpErr)
		if strings.Contains(body, "xxxx") {
			require.Equal(t, http.StatusRequestEntityTooLarge, httpErr.Code)
		} else {
			require.Equal(t, http.StatusBadRequest, httpErr.Code)
		}
	}
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"action":"ListMetrics","namespace":"AWS/EC2"}`)), httptest.NewRecorder())
	err := p.serve(c)
	var httpErr *echo.HTTPError
	require.ErrorAs(t, err, &httpErr)
	require.NotContains(t, err.Error(), "MUST NOT LEAK")
	require.Equal(t, http.StatusBadGateway, httpErr.Code)
}

func newTestCloudWatchProxy(client cloudWatchAPI) *cloudWatchProxy {
	return &cloudWatchProxy{
		config:     &cwSpec.Config{Region: "us-east-1"},
		policy:     config.CloudWatchConfig{Enable: true, AllowDefaultCredentials: true, AllowedRegions: []string{"us-east-1"}, AllowedAccounts: []string{"123456789012"}},
		testClient: client,
		runtime:    newCloudWatchRuntime(),
	}
}

func serveCloudWatch(t *testing.T, p *cloudWatchProxy, body string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	rec := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)), rec)
	return rec, p.serve(c)
}

func TestCloudWatchServeSuccess(t *testing.T) {
	p := newTestCloudWatchProxy(fakeCloudWatch{discovery: func(*cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
		return &cloudwatch.ListMetricsOutput{Metrics: []types.Metric{{Namespace: aws.String("AWS/EC2"), MetricName: aws.String("CPUUtilization")}}}, nil
	}})
	rec, err := serveCloudWatch(t, p, `{"action":"ListMetrics","namespace":"AWS/EC2"}`)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, rec.Code)
	require.Contains(t, rec.Body.String(), "CPUUtilization")
}

func TestCloudWatchServeErrorStatuses(t *testing.T) {
	for _, test := range []struct {
		name   string
		err    error
		status int
	}{
		{"deadline", fmt.Errorf("wrapped: %w", context.DeadlineExceeded), http.StatusGatewayTimeout},
		{"throttling", &smithy.GenericAPIError{Code: "ThrottlingException"}, http.StatusTooManyRequests},
		{"access denied", &smithy.GenericAPIError{Code: "AccessDenied", Message: "secret detail"}, http.StatusBadGateway},
	} {
		t.Run(test.name, func(t *testing.T) {
			p := newTestCloudWatchProxy(fakeCloudWatch{discovery: func(*cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
				return nil, test.err
			}})
			_, err := serveCloudWatch(t, p, `{"action":"ListMetrics","namespace":"AWS/EC2"}`)
			var httpErr *echo.HTTPError
			require.ErrorAs(t, err, &httpErr)
			require.Equal(t, test.status, httpErr.Code)
			require.NotContains(t, fmt.Sprint(httpErr.Message), "secret detail")
		})
	}
}

func TestCloudWatchServeLogsUpstreamErrors(t *testing.T) {
	hook := logtest.NewGlobal()
	defer hook.Reset()
	p := newTestCloudWatchProxy(fakeCloudWatch{discovery: func(*cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
		return nil, errors.New("sts: trust policy rejected")
	}})
	p.datasourceName = "my-cloudwatch"
	_, err := serveCloudWatch(t, p, `{"action":"ListMetrics","namespace":"AWS/EC2"}`)
	require.Error(t, err)
	entry := hook.LastEntry()
	require.NotNil(t, entry)
	require.Contains(t, entry.Message, "CloudWatch request failed")
	require.Equal(t, "my-cloudwatch", entry.Data[datasourceFieldLog])
	require.ErrorContains(t, entry.Data[logrus.ErrorKey].(error), "trust policy rejected")
}

func TestCloudWatchRuntimeSlotsTimeout(t *testing.T) {
	runtime := newCloudWatchRuntime()
	releases := make([]func(), 0, cloudWatchScopeSlots)
	for range cloudWatchScopeSlots {
		release, err := runtime.acquire(context.Background(), "scope-a")
		require.NoError(t, err)
		releases = append(releases, release)
	}
	// The scope is saturated: it must time out while another scope is still served.
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	_, err := runtime.acquire(ctx, "scope-a")
	require.ErrorIs(t, err, context.DeadlineExceeded)
	release, err := runtime.acquire(context.Background(), "scope-b")
	require.NoError(t, err)
	release()
	for _, release := range releases {
		release()
	}
	release, err = runtime.acquire(context.Background(), "scope-a")
	require.NoError(t, err)
	release()
}

func TestCloudWatchClientCache(t *testing.T) {
	now := time.Now()
	runtime := newCloudWatchRuntime()
	runtime.now = func() time.Time { return now }
	_, ok := runtime.getClient("k")
	require.False(t, ok)
	runtime.putClient("k", fakeCloudWatch{})
	_, ok = runtime.getClient("k")
	require.True(t, ok)
	now = now.Add(cloudWatchClientTTL + time.Second)
	_, ok = runtime.getClient("k")
	require.False(t, ok)
}

func TestCloudWatchLimitedReader(t *testing.T) {
	read := func(size int) error {
		reader := &cloudWatchLimitedReader{reader: strings.NewReader(strings.Repeat("a", size)), limit: 10}
		_, err := io.ReadAll(reader)
		return err
	}
	require.NoError(t, read(10))
	require.ErrorIs(t, read(11), errCloudWatchResponseTooLarge)
	require.ErrorIs(t, read(1000), errCloudWatchResponseTooLarge)
}

func TestCloudWatchScopeDependsOnIdentity(t *testing.T) {
	p := newTestCloudWatchProxy(nil)
	base := p.scope("")
	require.Equal(t, base, p.scope(""))
	require.NotEqual(t, base, p.scope("external-id"))
	p.config.RoleARN = "arn:aws:iam::123456789012:role/perses"
	require.NotEqual(t, base, p.scope(""))
}

func TestCloudWatchExternalIDSecret(t *testing.T) {
	p := newTestCloudWatchProxy(nil)
	p.config.ExternalIDSecret = "secret"
	_, err := p.externalID()
	require.ErrorIs(t, err, errCloudWatchExternalID)
}

func TestCloudWatchDiscoveryTruncation(t *testing.T) {
	request := cloudWatchRequest{Action: "ListMetrics", Namespace: "AWS/EC2", MetricName: "CPUUtilization"}
	for _, test := range []struct {
		name      string
		pages     int
		truncated bool
		count     int
	}{
		{"single page", 1, false, 500},
		{"all pages fit", 2, false, 1000},
		// For example 1500 EC2 instances: the first 1000 metrics are returned instead of an error.
		{"more metrics than the limit", 3, true, 1000},
		{"page limit", cloudWatchMaxPages + 5, true, 1000},
	} {
		t.Run(test.name, func(t *testing.T) {
			page := 0
			client := fakeCloudWatch{discovery: func(input *cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
				require.Nil(t, input.IncludeLinkedAccounts)
				page++
				output := &cloudwatch.ListMetricsOutput{Metrics: make([]types.Metric, 500)}
				if page < test.pages {
					output.NextToken = aws.String(fmt.Sprintf("page-%d", page))
				}
				return output, nil
			}}
			result, err := executeCloudWatchDiscovery(context.Background(), client, request)
			require.NoError(t, err)
			response := result.(cloudWatchListMetricsResponse)
			require.Equal(t, test.truncated, response.Truncated)
			require.Len(t, response.Metrics, test.count)
		})
	}
}

func TestCloudWatchDiscoveryResponse(t *testing.T) {
	client := fakeCloudWatch{discovery: func(*cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
		return &cloudwatch.ListMetricsOutput{Metrics: []types.Metric{
			{Namespace: aws.String("AWS/EC2"), MetricName: aws.String("CPUUtilization"), Dimensions: []types.Dimension{{Name: aws.String("InstanceId"), Value: aws.String("i-0123")}}},
			{Namespace: aws.String("AWS/EC2"), MetricName: aws.String("NetworkIn")},
		}}, nil
	}}
	result, err := executeCloudWatchDiscovery(context.Background(), client, cloudWatchRequest{Action: "ListMetrics", Namespace: "AWS/EC2"})
	require.NoError(t, err)
	data, err := json.Marshal(result)
	require.NoError(t, err)
	require.JSONEq(t, `{"Metrics":[
		{"Namespace":"AWS/EC2","MetricName":"CPUUtilization","Dimensions":[{"Name":"InstanceId","Value":"i-0123"}]},
		{"Namespace":"AWS/EC2","MetricName":"NetworkIn","Dimensions":[]}
	],"Truncated":false}`, string(data))
}

func TestCloudWatchDatapointEstimate(t *testing.T) {
	end := time.Now().UTC().Truncate(time.Minute)
	metric := func(id string, period int32) cloudWatchQuery {
		return cloudWatchQuery{ID: id, Metric: &cloudWatchMetric{Namespace: "AWS/EC2", Name: "CPUUtilization", Statistic: "Average", Period: period}}
	}
	hidden := false
	for _, test := range []struct {
		name    string
		days    int
		queries []cloudWatchQuery
		valid   bool
	}{
		{"one day at one minute", 1, []cloudWatchQuery{metric("m1", 60)}, true},
		{"seven days at one minute", 7, []cloudWatchQuery{metric("m1", 60)}, false},
		{"seven days at five minutes", 7, []cloudWatchQuery{metric("m1", 300)}, true},
		{"seven series over a day at one minute", 1, []cloudWatchQuery{metric("a", 60), metric("b", 60), metric("c", 60), metric("d", 60), metric("e", 60), metric("f", 60), metric("g", 60)}, false},
		{"hidden inputs are not returned", 1, []cloudWatchQuery{
			{ID: "m1", ReturnData: &hidden, Metric: metric("m1", 60).Metric},
			{ID: "m2", ReturnData: &hidden, Metric: metric("m2", 60).Metric},
			{ID: "e1", Expression: "m1 + m2"},
		}, true},
		{"expressions use the metric period", 7, []cloudWatchQuery{
			{ID: "m1", ReturnData: &hidden, Metric: metric("m1", 60).Metric},
			{ID: "e1", Expression: "m1 * 2"},
		}, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			request := cloudWatchRequest{Action: "GetMetricData", StartTime: end.Add(-time.Duration(test.days) * 24 * time.Hour), EndTime: end, Queries: test.queries}
			err := request.validate(time.Now())
			if test.valid {
				require.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, errCloudWatchTooManyDatapoints)
			require.ErrorContains(t, err, "increase the period")
		})
	}
}

func TestCloudWatchServeTooManyDatapoints(t *testing.T) {
	request := validCWRequest()
	p := newTestCloudWatchProxy(fakeCloudWatch{metrics: func(*cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error) {
		// AWS returned more datapoints than estimated, for example because of an expression.
		return &cloudwatch.GetMetricDataOutput{MetricDataResults: []types.MetricDataResult{{
			Id: aws.String("m1"), StatusCode: types.StatusCodeComplete,
			Values: make([]float64, cloudWatchMaxPoints+1), Timestamps: make([]time.Time, cloudWatchMaxPoints+1),
		}}}, nil
	}})
	body, err := json.Marshal(request)
	require.NoError(t, err)
	_, err = serveCloudWatch(t, p, string(body))
	var httpErr *echo.HTTPError
	require.ErrorAs(t, err, &httpErr)
	require.Equal(t, http.StatusBadRequest, httpErr.Code)
	require.Contains(t, fmt.Sprint(httpErr.Message), "increase the period")
}

func TestCloudWatchRuntimeReleasesIdleScopes(t *testing.T) {
	runtime := newCloudWatchRuntime()
	release, err := runtime.acquire(context.Background(), "scope-a")
	require.NoError(t, err)
	require.Len(t, runtime.scopeSlots, 1)
	release()
	require.Empty(t, runtime.scopeSlots)

	// A waiting request keeps the scope, so the slots are not duplicated.
	releases := make([]func(), 0, cloudWatchScopeSlots)
	for range cloudWatchScopeSlots {
		release, err := runtime.acquire(context.Background(), "scope-a")
		require.NoError(t, err)
		releases = append(releases, release)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	_, err = runtime.acquire(ctx, "scope-a")
	require.ErrorIs(t, err, context.DeadlineExceeded)
	require.Equal(t, cloudWatchScopeSlots, runtime.scopeSlots["scope-a"].users)
	for _, release := range releases {
		release()
	}
	require.Empty(t, runtime.scopeSlots)
}

type cloudWatchRoundTripper func(*http.Request) (*http.Response, error)

func (f cloudWatchRoundTripper) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}

func TestCloudWatchSDKCredentialsAndEndpoints(t *testing.T) {
	t.Setenv("AWS_ACCESS_KEY_ID", "test-access-key")
	t.Setenv("AWS_SECRET_ACCESS_KEY", "test-secret-key")
	t.Setenv("AWS_SESSION_TOKEN", "test-session-token")
	t.Setenv("AWS_EC2_METADATA_DISABLED", "true")
	t.Setenv("AWS_ENDPOINT_URL", "http://untrusted.invalid")
	t.Setenv("AWS_ENDPOINT_URL_STS", "http://untrusted.invalid")
	t.Setenv("AWS_ENDPOINT_URL_CLOUDWATCH", "http://untrusted.invalid")
	calls := 0
	transport := cloudWatchRoundTripper(func(request *http.Request) (*http.Response, error) {
		calls++
		require.Equal(t, "https", request.URL.Scheme)
		require.Equal(t, "sts.us-east-1.amazonaws.com", request.URL.Host)
		require.Contains(t, request.Header.Get("Authorization"), "AWS4-HMAC-SHA256")
		require.Equal(t, "test-session-token", request.Header.Get("X-Amz-Security-Token"))
		return &http.Response{StatusCode: http.StatusOK, Header: http.Header{"Content-Type": []string{"text/xml"}}, Body: io.NopCloser(strings.NewReader(
			`<GetCallerIdentityResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/"><GetCallerIdentityResult><Arn>arn:aws:iam::123456789012:user/test</Arn><UserId>test</UserId><Account>123456789012</Account></GetCallerIdentityResult></GetCallerIdentityResponse>`,
		))}, nil
	})
	p := &cloudWatchProxy{config: &cwSpec.Config{Region: "us-east-1"}, policy: config.CloudWatchConfig{AllowedAccounts: []string{"123456789012"}}, transport: transport}
	client, err := p.newCloudWatchClient(context.Background(), "")
	require.NoError(t, err)
	options := client.(*cloudwatch.Client).Options()
	require.Nil(t, options.BaseEndpoint)
	require.Equal(t, "us-east-1", options.Region)
	require.Equal(t, 1, calls)
	p.policy.AllowedAccounts = []string{"999999999999"}
	_, err = p.newCloudWatchClient(context.Background(), "")
	require.Error(t, err)
}

func TestCloudWatchDashboardDatasourceRejected(t *testing.T) {
	newSpec := func(proxy map[string]any) datasourceSpec.Spec {
		return datasourceSpec.Spec{Plugin: plugin.Plugin{Kind: "CloudWatchDatasource", Spec: map[string]any{"proxy": proxy}}}
	}
	cloudWatchDatasource := newSpec(map[string]any{"kind": "CloudWatchProxy", "spec": map[string]any{"region": "us-east-1"}})
	require.True(t, isCloudWatchDatasource(cloudWatchDatasource))
	require.False(t, isCloudWatchDatasource(newSpec(map[string]any{"kind": "HTTPProxy", "spec": map[string]any{"url": "http://localhost:9090"}})))

	e := &endpoint{}
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"action":"ListMetrics","namespace":"AWS/EC2"}`)), httptest.NewRecorder())
	err := e.proxyDashboardDatasource(c, "project", "cloudwatch", "", cloudWatchDatasource, func(string) (*v1.SecretSpec, error) {
		t.Fatal("the secret must not be loaded")
		return nil, nil
	})
	require.ErrorIs(t, err, apiinterface.ForbiddenError)
	require.ErrorContains(t, err, "use a project or global datasource")
}
