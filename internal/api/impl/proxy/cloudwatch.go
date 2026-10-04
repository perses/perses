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
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"regexp"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/arn"
	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/aws/smithy-go"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourcev1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceSpec "github.com/perses/spec/go/datasource"
	cwSpec "github.com/perses/spec/go/datasource/proxy/cloudwatch"
	"github.com/sirupsen/logrus"
)

const (
	cloudWatchMaxBody   = 64 * 1024
	cloudWatchMaxPoints = 10000
	cloudWatchMaxPages  = 10
	cloudWatchTimeout   = 30 * time.Second
	// cloudWatchMaxResponse is the maximum size of an AWS response body.
	cloudWatchMaxResponse = 8 * 1024 * 1024
	// cloudWatchGlobalSlots is the number of concurrent CloudWatch requests allowed for the whole server.
	cloudWatchGlobalSlots = 16
	// cloudWatchScopeSlots is the number of concurrent CloudWatch requests allowed for a single AWS identity (region + role + external ID),
	// so a slow identity can't starve the others.
	cloudWatchScopeSlots = 4
	// cloudWatchClientTTL is how long a verified AWS client (and its credentials) is reused.
	cloudWatchClientTTL  = 5 * time.Minute
	cloudWatchMaxClients = 256
	// cloudWatchMaxDiscoveredMetrics is the maximum number of metrics returned by a discovery request.
	cloudWatchMaxDiscoveredMetrics = 1000
)

var errCloudWatchResponseTooLarge = errors.New("AWS response exceeds the size limit")
var errCloudWatchExternalID = errors.New("invalid external ID secret")
var errCloudWatchIdentityNotPermitted = errors.New("AWS identity is not permitted")
var errCloudWatchTooManyDatapoints = fmt.Errorf("CloudWatch queries can return at most %d datapoints", cloudWatchMaxPoints)

var cloudWatchID = regexp.MustCompile(`^[a-z][a-zA-Z0-9_]{0,63}$`)
var cloudWatchStatistic = regexp.MustCompile(`^(Average|Sum|Minimum|Maximum|SampleCount|p([0-9]|[1-9][0-9])(\.[0-9]{1,2})?|p100)$`)
var cloudWatchExpressionChars = regexp.MustCompile(`^[a-zA-Z0-9_+\-*/()., <>=!%]+$`)
var cloudWatchExpressionToken = regexp.MustCompile(`[A-Za-z_][A-Za-z0-9_]*`)

// Metrics Insights SQL is intentionally not supported. Metric math is case-sensitive: only the upper-case function names are accepted.
var cloudWatchSQLKeywords = []string{"SELECT", "FROM", "WHERE", "GROUP", "ORDER", "BY", "LIMIT", "HAVING", "UNION", "JOIN"}
var cloudWatchFunctions = []string{"ABS", "CEIL", "FLOOR", "IF", "FILL", "RATE", "DIFF", "DIFF_TIME", "MIN", "MAX", "SUM", "AVG"}

// cloudWatchRuntime holds the process-wide state shared by the CloudWatch proxies. It is injectable to keep tests isolated.
type cloudWatchRuntime struct {
	slots chan struct{}

	mutex        sync.Mutex
	scopeSlots   map[string]*cloudWatchScope
	clients      map[string]cloudWatchClientEntry
	clientExpiry time.Duration
	now          func() time.Time
}

// cloudWatchScope limits the concurrent requests of an AWS identity.
// users counts the requests holding or waiting for a slot, so the scope is removed once it is idle.
type cloudWatchScope struct {
	slots chan struct{}
	users int
}

type cloudWatchClientEntry struct {
	client  cloudWatchAPI
	expires time.Time
}

func newCloudWatchRuntime() *cloudWatchRuntime {
	return &cloudWatchRuntime{
		slots:        make(chan struct{}, cloudWatchGlobalSlots),
		scopeSlots:   map[string]*cloudWatchScope{},
		clients:      map[string]cloudWatchClientEntry{},
		clientExpiry: cloudWatchClientTTL,
		now:          time.Now,
	}
}

var defaultCloudWatchRuntime = newCloudWatchRuntime()

// acquire reserves a slot for the given scope and a global one. The returned function releases them.
func (r *cloudWatchRuntime) acquire(ctx context.Context, scope string) (func(), error) {
	r.mutex.Lock()
	s, ok := r.scopeSlots[scope]
	if !ok {
		s = &cloudWatchScope{slots: make(chan struct{}, cloudWatchScopeSlots)}
		r.scopeSlots[scope] = s
	}
	s.users++
	r.mutex.Unlock()
	leave := func() {
		r.mutex.Lock()
		defer r.mutex.Unlock()
		s.users--
		if s.users == 0 {
			delete(r.scopeSlots, scope)
		}
	}
	select {
	case s.slots <- struct{}{}:
	case <-ctx.Done():
		leave()
		return nil, ctx.Err()
	}
	select {
	case r.slots <- struct{}{}:
	case <-ctx.Done():
		<-s.slots
		leave()
		return nil, ctx.Err()
	}
	return func() {
		<-r.slots
		<-s.slots
		leave()
	}, nil
}

func (r *cloudWatchRuntime) getClient(key string) (cloudWatchAPI, bool) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	entry, ok := r.clients[key]
	if !ok || !r.now().Before(entry.expires) {
		delete(r.clients, key)
		return nil, false
	}
	return entry.client, true
}

func (r *cloudWatchRuntime) putClient(key string, client cloudWatchAPI) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	now := r.now()
	for k, entry := range r.clients {
		if !now.Before(entry.expires) {
			delete(r.clients, k)
		}
	}
	if len(r.clients) >= cloudWatchMaxClients {
		clear(r.clients)
	}
	r.clients[key] = cloudWatchClientEntry{client: client, expires: now.Add(r.clientExpiry)}
}

type cloudWatchMetric struct {
	Namespace  string            `json:"namespace"`
	Name       string            `json:"name"`
	Dimensions map[string]string `json:"dimensions,omitempty"`
	Statistic  string            `json:"statistic"`
	Period     int32             `json:"period"`
}

type cloudWatchQuery struct {
	ID         string            `json:"id"`
	Metric     *cloudWatchMetric `json:"metric,omitempty"`
	Expression string            `json:"expression,omitempty"`
	Label      string            `json:"label,omitempty"`
	ReturnData *bool             `json:"returnData,omitempty"`
}

type cloudWatchRequest struct {
	Action     string            `json:"action"`
	StartTime  time.Time         `json:"startTime,omitempty"`
	EndTime    time.Time         `json:"endTime,omitempty"`
	Queries    []cloudWatchQuery `json:"queries,omitempty"`
	Namespace  string            `json:"namespace,omitempty"`
	MetricName string            `json:"metricName,omitempty"`
	Dimensions map[string]string `json:"dimensions,omitempty"`
}

// The responses keep the field names of the AWS GetMetricData and ListMetrics APIs, but are defined here
// so the HTTP contract of the proxy does not depend on the AWS SDK types.
type cloudWatchMetricDataResponse struct {
	MetricDataResults []cloudWatchMetricDataResult `json:"MetricDataResults"`
}

type cloudWatchMetricDataResult struct {
	ID         string      `json:"Id"`
	Label      string      `json:"Label"`
	Timestamps []time.Time `json:"Timestamps"`
	Values     []float64   `json:"Values"`
	StatusCode string      `json:"StatusCode"`
}

type cloudWatchListMetricsResponse struct {
	Metrics []cloudWatchMetricInfo `json:"Metrics"`
	// Truncated is true when more metrics match the discovery than the returned ones.
	Truncated bool `json:"Truncated"`
}

type cloudWatchMetricInfo struct {
	Namespace  string                `json:"Namespace"`
	MetricName string                `json:"MetricName"`
	Dimensions []cloudWatchDimension `json:"Dimensions"`
}

type cloudWatchDimension struct {
	Name  string `json:"Name"`
	Value string `json:"Value"`
}

type cloudWatchAPI interface {
	GetMetricData(context.Context, *cloudwatch.GetMetricDataInput, ...func(*cloudwatch.Options)) (*cloudwatch.GetMetricDataOutput, error)
	ListMetrics(context.Context, *cloudwatch.ListMetricsInput, ...func(*cloudwatch.Options)) (*cloudwatch.ListMetricsOutput, error)
}

type cloudWatchProxy struct {
	config         *cwSpec.Config
	policy         config.CloudWatchConfig
	secret         *v1.SecretSpec
	path           string
	datasourceName string
	runtime        *cloudWatchRuntime
	// client is injected only in tests; production clients are built with SDK credential providers.
	testClient cloudWatchAPI
	transport  http.RoundTripper
}

func validateCloudWatchPolicy(policy config.CloudWatchConfig, cfg *cwSpec.Config) error {
	denied := echo.NewHTTPError(http.StatusForbidden, "CloudWatch datasource is not permitted by server policy")
	if !policy.Enable || cfg == nil || cfg.Validate() != nil || !slices.Contains(policy.AllowedRegions, cfg.Region) || len(policy.AllowedAccounts) == 0 {
		return denied
	}
	if cfg.RoleARN == "" {
		if !policy.AllowDefaultCredentials {
			return denied
		}
	} else {
		role, err := arn.Parse(cfg.RoleARN)
		if err != nil || !slices.Contains(policy.AllowedRoles, cfg.RoleARN) || !slices.Contains(policy.AllowedAccounts, role.AccountID) {
			return denied
		}
	}
	return nil
}

// isCloudWatchDatasource tells whether the datasource uses the CloudWatch proxy.
func isCloudWatchDatasource(spec datasourceSpec.Spec) bool {
	_, kind, err := datasourcev1.ValidateAndExtract(spec.Plugin.Spec)
	return err == nil && kind == cwSpec.ProxyKindName
}

func (p *cloudWatchProxy) getRuntime() *cloudWatchRuntime {
	if p.runtime == nil {
		return defaultCloudWatchRuntime
	}
	return p.runtime
}

// externalID returns the external ID used to assume the role, if any.
func (p *cloudWatchProxy) externalID() (string, error) {
	if p.config.ExternalIDSecret == "" {
		return "", nil
	}
	if p.secret == nil || p.secret.Authorization == nil {
		return "", fmt.Errorf("%w: missing secret", errCloudWatchExternalID)
	}
	externalID, err := p.secret.Authorization.GetCredentials()
	if err != nil || len(externalID) < 2 || len(externalID) > 1224 {
		return "", errCloudWatchExternalID
	}
	return externalID, nil
}

// scope identifies the AWS identity used by the proxy. The external ID is hashed so it is never kept as a map key.
func (p *cloudWatchProxy) scope(externalID string) string {
	sum := sha256.Sum256([]byte(strings.Join([]string{p.config.Region, p.config.RoleARN, externalID}, "\x00")))
	return hex.EncodeToString(sum[:])
}

// client returns a client verified against the account allowlist. The verification (STS) is done only when the cached client expires.
func (p *cloudWatchProxy) client(ctx context.Context, externalID, scope string) (cloudWatchAPI, error) {
	if p.testClient != nil {
		return p.testClient, nil
	}
	runtime := p.getRuntime()
	if client, ok := runtime.getClient(scope); ok {
		return client, nil
	}
	client, err := p.newCloudWatchClient(ctx, externalID)
	if err != nil {
		return nil, err
	}
	runtime.putClient(scope, client)
	return client, nil
}

// newCloudWatchClient never accepts caller-supplied credentials, endpoint URLs, or AWS action names.
func (p *cloudWatchProxy) newCloudWatchClient(ctx context.Context, externalID string) (cloudWatchAPI, error) {
	// The credential providers of the default chain (environment, web identity, ECS, EC2 instance metadata) are created
	// by LoadDefaultConfig with this client, so they keep the timeout but not the response limit set below.
	sdkHTTP := awshttp.NewBuildableClient().WithTimeout(cloudWatchTimeout)
	cfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(p.config.Region), awsconfig.WithHTTPClient(sdkHTTP), awsconfig.WithRetryMaxAttempts(2))
	if err != nil {
		return nil, fmt.Errorf("unable to load the AWS configuration: %w", err)
	}
	transport := p.transport
	if transport == nil {
		transport = http.DefaultTransport
		// Preserve administrator-configured CA bundles loaded by the SDK.
		if sdkClient, ok := cfg.HTTPClient.(interface{ GetTransport() *http.Transport }); ok {
			transport = sdkClient.GetTransport()
		}
	}
	cfg.HTTPClient = &http.Client{
		Timeout:       cloudWatchTimeout,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return errors.New("AWS redirects are disabled") },
		Transport:     cloudWatchTransport{base: transport},
	}
	newSTS := func(c aws.Config) *sts.Client {
		return sts.NewFromConfig(c, func(o *sts.Options) {
			o.BaseEndpoint = nil
			o.EndpointResolverV2 = sts.NewDefaultEndpointResolverV2()
		})
	}
	if p.config.RoleARN != "" {
		provider := stscreds.NewAssumeRoleProvider(newSTS(cfg), p.config.RoleARN, func(o *stscreds.AssumeRoleOptions) {
			o.RoleSessionName = "perses-cloudwatch"
			if externalID != "" {
				o.ExternalID = aws.String(externalID)
			}
		})
		cfg.Credentials = aws.NewCredentialsCache(provider)
	}
	identity, err := newSTS(cfg).GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return nil, fmt.Errorf("unable to get the AWS caller identity: %w", err)
	}
	if identity == nil || !slices.Contains(p.policy.AllowedAccounts, aws.ToString(identity.Account)) {
		return nil, errCloudWatchIdentityNotPermitted
	}
	return cloudwatch.NewFromConfig(cfg, func(o *cloudwatch.Options) {
		o.BaseEndpoint = nil
		o.EndpointResolverV2 = cloudwatch.NewDefaultEndpointResolverV2()
	}), nil
}

// cloudWatchTransport bounds the response bodies of the STS (AssumeRole, GetCallerIdentity) and CloudWatch calls.
type cloudWatchTransport struct{ base http.RoundTripper }
type cloudWatchLimitedBody struct {
	io.Reader
	io.Closer
}

// cloudWatchLimitedReader fails explicitly once more than limit bytes are read, instead of silently truncating the body.
type cloudWatchLimitedReader struct {
	reader io.Reader
	limit  int64
	read   int64
}

func (l *cloudWatchLimitedReader) Read(p []byte) (int, error) {
	if l.read > l.limit {
		return 0, errCloudWatchResponseTooLarge
	}
	// Read one byte more than the limit to detect an oversized body.
	if remaining := l.limit - l.read + 1; int64(len(p)) > remaining {
		p = p[:remaining]
	}
	n, err := l.reader.Read(p)
	l.read += int64(n)
	if l.read > l.limit {
		return n - int(l.read-l.limit), errCloudWatchResponseTooLarge
	}
	return n, err
}

func (t cloudWatchTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	response, err := t.base.RoundTrip(req)
	if err == nil && response.Body != nil {
		response.Body = cloudWatchLimitedBody{Reader: &cloudWatchLimitedReader{reader: response.Body, limit: cloudWatchMaxResponse}, Closer: response.Body}
	}
	return response, err
}

func (p *cloudWatchProxy) serve(c echo.Context) error {
	if err := validateCloudWatchPolicy(p.policy, p.config); err != nil {
		return err
	}
	if c.Request().Method != http.MethodPost || (p.path != "" && p.path != "/") || c.Request().URL.RawQuery != "" {
		return echo.NewHTTPError(http.StatusBadRequest, "CloudWatch requires POST on the datasource root without URL parameters")
	}
	if c.Request().Body == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "missing CloudWatch request")
	}
	var request cloudWatchRequest
	decoder := json.NewDecoder(http.MaxBytesReader(c.Response(), c.Request().Body, cloudWatchMaxBody))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		return invalidCloudWatchRequest(err)
	}
	if err := decoder.Decode(new(any)); !errors.Is(err, io.EOF) {
		return invalidCloudWatchRequest(err)
	}
	if err := request.validate(time.Now()); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	ctx, cancel := context.WithTimeout(c.Request().Context(), cloudWatchTimeout)
	defer cancel()
	externalID, err := p.externalID()
	if err != nil {
		return p.upstreamError(err)
	}
	scope := p.scope(externalID)
	release, err := p.getRuntime().acquire(ctx, scope)
	if err != nil {
		return echo.NewHTTPError(http.StatusGatewayTimeout, "CloudWatch request timed out")
	}
	defer release()
	client, err := p.client(ctx, externalID, scope)
	if err != nil {
		return p.upstreamError(err)
	}
	var result any
	switch request.Action {
	case "GetMetricData":
		result, err = executeCloudWatchMetrics(ctx, client, request)
	case "ListMetrics":
		result, err = executeCloudWatchDiscovery(ctx, client, request)
	}
	if errors.Is(err, errCloudWatchTooManyDatapoints) {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("%s; increase the period or reduce the time range", errCloudWatchTooManyDatapoints))
	}
	if err != nil {
		return p.upstreamError(err)
	}
	return c.JSON(http.StatusOK, result)
}

func invalidCloudWatchRequest(err error) error {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		return echo.NewHTTPError(http.StatusRequestEntityTooLarge, "CloudWatch request is too large")
	}
	return echo.NewHTTPError(http.StatusBadRequest, "invalid CloudWatch request")
}

// upstreamError logs the real cause for the operators and returns a generic error to the client,
// which must never learn about credentials or AWS internals.
func (p *cloudWatchProxy) upstreamError(err error) error {
	logrus.WithError(err).WithFields(logrus.Fields{
		datasourceFieldLog: p.datasourceName,
		"region":           p.config.Region,
		"role":             p.config.RoleARN,
	}).Error("CloudWatch request failed")
	var apiErr smithy.APIError
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		return echo.NewHTTPError(http.StatusGatewayTimeout, "CloudWatch request timed out")
	case errors.As(err, &apiErr) && isCloudWatchThrottling(apiErr.ErrorCode()):
		return echo.NewHTTPError(http.StatusTooManyRequests, "CloudWatch is throttling the requests")
	case errors.Is(err, errCloudWatchIdentityNotPermitted), errors.Is(err, errCloudWatchExternalID):
		return echo.NewHTTPError(http.StatusBadGateway, "CloudWatch authentication failed")
	}
	return echo.NewHTTPError(http.StatusBadGateway, "CloudWatch query failed or exceeded limits; narrow the query and check AWS permissions")
}

func isCloudWatchThrottling(code string) bool {
	switch code {
	case "Throttling", "ThrottlingException", "RequestLimitExceeded", "LimitExceededException":
		return true
	}
	return false
}

func (r *cloudWatchRequest) validate(now time.Time) error {
	switch r.Action {
	case "ListMetrics":
		if !validCloudWatchName(r.Namespace) || len(r.MetricName) > 255 || len(r.Dimensions) > 30 || len(r.Queries) != 0 || !r.StartTime.IsZero() || !r.EndTime.IsZero() {
			return errors.New("ListMetrics requires a namespace and at most 30 dimensions")
		}
	case "GetMetricData":
		if r.Namespace != "" || r.MetricName != "" || len(r.Dimensions) != 0 {
			return errors.New("discovery fields are not allowed in GetMetricData")
		}
		if r.StartTime.IsZero() || !r.EndTime.After(r.StartTime) || r.EndTime.Sub(r.StartTime) > 31*24*time.Hour || r.EndTime.After(now.Add(5*time.Minute)) || r.StartTime.Before(now.Add(-455*24*time.Hour)) {
			return errors.New("CloudWatch time range must be within retention, at most 31 days, and not in the future")
		}
		if len(r.Queries) < 1 || len(r.Queries) > 20 {
			return errors.New("CloudWatch requires between 1 and 20 queries")
		}
		if err := validateCloudWatchQueries(r.Queries); err != nil {
			return err
		}
		if points := estimateCloudWatchDatapoints(r.Queries, r.EndTime.Sub(r.StartTime)); points > cloudWatchMaxPoints {
			return fmt.Errorf("%w: the query returns about %d datapoints; increase the period or reduce the time range", errCloudWatchTooManyDatapoints, points)
		}
	default:
		return errors.New("only GetMetricData and ListMetrics are supported")
	}
	if !validCloudWatchDimensions(r.Dimensions) {
		return errors.New("invalid CloudWatch dimensions")
	}
	return nil
}

// estimateCloudWatchDatapoints returns the maximum number of datapoints returned by the queries.
// An expression is assumed to have the smallest period of the metrics, as it is usually computed from them.
func estimateCloudWatchDatapoints(queries []cloudWatchQuery, timeRange time.Duration) int {
	minPeriod := int32(math.MaxInt32)
	for _, query := range queries {
		if query.Metric != nil {
			minPeriod = min(minPeriod, query.Metric.Period)
		}
	}
	if minPeriod == math.MaxInt32 {
		minPeriod = 60
	}
	total := 0
	for _, query := range queries {
		if query.ReturnData != nil && !*query.ReturnData {
			continue
		}
		period := minPeriod
		if query.Metric != nil {
			period = query.Metric.Period
		}
		total += int(math.Ceil(timeRange.Seconds() / float64(period)))
	}
	return total
}

func validCloudWatchName(value string) bool {
	return strings.TrimSpace(value) != "" && len(value) <= 255 && !strings.ContainsAny(value, "\x00\r\n")
}

func validateCloudWatchQueries(queries []cloudWatchQuery) error {
	ids := map[string]bool{}
	returnsData := false
	for _, query := range queries {
		if !cloudWatchID.MatchString(query.ID) || ids[query.ID] || len(query.Label) > 255 || (query.Metric == nil) == (query.Expression == "") {
			return errors.New("each CloudWatch query needs a unique ID and either a metric or expression")
		}
		ids[query.ID] = true
		returnsData = returnsData || query.ReturnData == nil || *query.ReturnData
		if query.Metric != nil {
			m := query.Metric
			if !validCloudWatchName(m.Namespace) || !validCloudWatchName(m.Name) || len(m.Dimensions) > 30 || !cloudWatchStatistic.MatchString(m.Statistic) || m.Period < 60 || m.Period > 86400 || m.Period%60 != 0 {
				return errors.New("invalid metric, statistic, dimensions or period (60–86400 seconds, multiple of 60)")
			}
			if !validCloudWatchDimensions(m.Dimensions) {
				return errors.New("invalid CloudWatch dimensions")
			}
		} else if !validCloudWatchExpression(query.Expression) {
			return errors.New("only arithmetic and supported local metric math functions are allowed")
		}
	}
	if !returnsData {
		return errors.New("at least one query must return data")
	}
	return nil
}

func validCloudWatchDimensions(dimensions map[string]string) bool {
	for name, value := range dimensions {
		if !validCloudWatchName(name) || !validCloudWatchName(value) {
			return false
		}
	}
	return true
}

func validCloudWatchExpression(expression string) bool {
	if len(expression) > 1024 || !cloudWatchExpressionChars.MatchString(expression) {
		return false
	}
	for _, location := range cloudWatchExpressionToken.FindAllStringIndex(expression, -1) {
		token := expression[location[0]:location[1]]
		if slices.Contains(cloudWatchSQLKeywords, strings.ToUpper(token)) {
			return false
		}
		// A token directly followed by "(" is a function call.
		if strings.HasPrefix(strings.TrimLeft(expression[location[1]:], " "), "(") && !slices.Contains(cloudWatchFunctions, token) {
			return false
		}
	}
	return true
}

func executeCloudWatchMetrics(ctx context.Context, client cloudWatchAPI, request cloudWatchRequest) (any, error) {
	input := &cloudwatch.GetMetricDataInput{
		StartTime: &request.StartTime, EndTime: &request.EndTime,
		MaxDatapoints: aws.Int32(cloudWatchMaxPoints), ScanBy: types.ScanByTimestampAscending,
	}
	expected := map[string]bool{}
	for _, q := range request.Queries {
		query := types.MetricDataQuery{Id: aws.String(q.ID), ReturnData: aws.Bool(q.ReturnData == nil || *q.ReturnData)}
		expected[q.ID] = *query.ReturnData
		if q.Label != "" {
			query.Label = aws.String(q.Label)
		}
		if q.Metric != nil {
			m := q.Metric
			metric := &types.Metric{Namespace: aws.String(m.Namespace), MetricName: aws.String(m.Name)}
			for name, value := range m.Dimensions {
				metric.Dimensions = append(metric.Dimensions, types.Dimension{Name: aws.String(name), Value: aws.String(value)})
			}
			query.MetricStat = &types.MetricStat{Metric: metric, Period: aws.Int32(m.Period), Stat: aws.String(m.Statistic)}
		} else {
			query.Expression = aws.String(q.Expression)
		}
		input.MetricDataQueries = append(input.MetricDataQueries, query)
	}
	results := map[string]*types.MetricDataResult{}
	total := 0
	tokens := map[string]bool{}
	for page := 0; page < cloudWatchMaxPages; page++ {
		output, err := client.GetMetricData(ctx, input)
		if err != nil {
			return nil, err
		}
		if output == nil || len(output.Messages) != 0 {
			return nil, errors.New("incomplete CloudWatch response")
		}
		for _, result := range output.MetricDataResults {
			id := aws.ToString(result.Id)
			if !expected[id] || len(result.Messages) != 0 || len(result.Values) != len(result.Timestamps) ||
				(result.StatusCode != types.StatusCodeComplete && result.StatusCode != types.StatusCodePartialData) {
				return nil, errors.New("incomplete CloudWatch result")
			}
			total += len(result.Values)
			if total > cloudWatchMaxPoints {
				return nil, errCloudWatchTooManyDatapoints
			}
			existing := results[id]
			if existing == nil {
				existing = &types.MetricDataResult{Id: result.Id, Label: result.Label, Timestamps: []time.Time{}, Values: []float64{}}
				results[id] = existing
			}
			if err := appendCloudWatchDatapoints(existing, result, request.StartTime, request.EndTime); err != nil {
				return nil, err
			}
			existing.StatusCode = result.StatusCode
		}
		token := aws.ToString(output.NextToken)
		if token == "" {
			response := cloudWatchMetricDataResponse{MetricDataResults: []cloudWatchMetricDataResult{}}
			for _, q := range request.Queries {
				if expected[q.ID] {
					result := results[q.ID]
					if result == nil || result.StatusCode != types.StatusCodeComplete {
						return nil, errors.New("incomplete CloudWatch query")
					}
					response.MetricDataResults = append(response.MetricDataResults, cloudWatchMetricDataResult{
						ID:         q.ID,
						Label:      aws.ToString(result.Label),
						Timestamps: result.Timestamps,
						Values:     result.Values,
						StatusCode: string(result.StatusCode),
					})
				}
			}
			return response, nil
		}
		if tokens[token] {
			return nil, errors.New("repeated CloudWatch pagination token")
		}
		tokens[token] = true
		input.NextToken = output.NextToken
	}
	return nil, errors.New("CloudWatch page limit exceeded")
}

func appendCloudWatchDatapoints(existing *types.MetricDataResult, result types.MetricDataResult, start, end time.Time) error {
	for i, value := range result.Values {
		if math.IsNaN(value) || math.IsInf(value, 0) || result.Timestamps[i].Before(start.Add(-time.Hour)) || !result.Timestamps[i].Before(end) {
			return errors.New("invalid CloudWatch datapoint")
		}
	}
	for i, timestamp := range result.Timestamps {
		// AWS rounds StartTime down (up to an hour for older metrics). Do not return data outside the requested interval.
		if timestamp.Before(start) {
			continue
		}
		if n := len(existing.Timestamps); n > 0 && !timestamp.After(existing.Timestamps[n-1]) {
			return errors.New("unordered CloudWatch datapoints")
		}
		existing.Timestamps = append(existing.Timestamps, timestamp)
		existing.Values = append(existing.Values, result.Values[i])
	}
	return nil
}

func executeCloudWatchDiscovery(ctx context.Context, client cloudWatchAPI, request cloudWatchRequest) (any, error) {
	input := &cloudwatch.ListMetricsInput{Namespace: aws.String(request.Namespace)}
	if request.MetricName != "" {
		input.MetricName = aws.String(request.MetricName)
	}
	for name, value := range request.Dimensions {
		input.Dimensions = append(input.Dimensions, types.DimensionFilter{Name: aws.String(name), Value: aws.String(value)})
	}
	response := cloudWatchListMetricsResponse{Metrics: []cloudWatchMetricInfo{}}
	tokens := map[string]bool{}
	for page := 0; page < cloudWatchMaxPages; page++ {
		output, err := client.ListMetrics(ctx, input)
		if err != nil {
			return nil, err
		}
		if output == nil {
			return nil, errors.New("incomplete CloudWatch response")
		}
		for _, metric := range output.Metrics {
			// Large accounts can have many more metrics than a picker can display: return the first ones and say so,
			// the caller can narrow the discovery with metricName and dimensions.
			if len(response.Metrics) == cloudWatchMaxDiscoveredMetrics {
				response.Truncated = true
				return response, nil
			}
			info := cloudWatchMetricInfo{Namespace: aws.ToString(metric.Namespace), MetricName: aws.ToString(metric.MetricName), Dimensions: []cloudWatchDimension{}}
			for _, dimension := range metric.Dimensions {
				info.Dimensions = append(info.Dimensions, cloudWatchDimension{Name: aws.ToString(dimension.Name), Value: aws.ToString(dimension.Value)})
			}
			response.Metrics = append(response.Metrics, info)
		}
		token := aws.ToString(output.NextToken)
		if token == "" {
			return response, nil
		}
		if tokens[token] {
			return nil, errors.New("repeated CloudWatch pagination token")
		}
		tokens[token] = true
		input.NextToken = output.NextToken
	}
	response.Truncated = true
	return response, nil
}
