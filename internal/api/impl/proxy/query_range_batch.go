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
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/utils"
)

const (
	// Prometheus HTTP API paths (same "/api/v1" prefix as Perses REST, by convention).
	queryRangeBatchPathSuffix = utils.APIV1Prefix + "/query_range_batch"
	queryRangePathSuffix      = utils.APIV1Prefix + "/query_range"
	defaultBatchTimeout       = 120 * time.Second
	defaultBatchConcurrency   = 8
	maxBatchQueries           = 64
)

type rangeQueryBatchItem struct {
	ID    string `json:"id"`
	Query string `json:"query"`
}

type rangeQueryBatchRequest struct {
	Start   json.Number           `json:"start"`
	End     json.Number           `json:"end"`
	Step    json.Number           `json:"step"`
	Timeout string                `json:"timeout,omitempty"`
	Queries []rangeQueryBatchItem `json:"queries"`
}

type rangeQueryBatchResponse struct {
	Status string `json:"status"`
	Data   struct {
		Results map[string]json.RawMessage `json:"results"`
	} `json:"data"`
}

func isQueryRangeBatchPath(path string) bool {
	return strings.HasSuffix(path, queryRangeBatchPathSuffix)
}

// pathForAllowlist maps batch → query_range so existing allowlists keep working.
func pathForAllowlist(path string) string {
	if isQueryRangeBatchPath(path) {
		return strings.TrimSuffix(path, "_batch")
	}
	return path
}

func (h *httpProxy) serveQueryRangeBatch(c echo.Context) error {
	req := c.Request()
	if req.Method != http.MethodPost {
		return echo.NewHTTPError(http.StatusMethodNotAllowed, "query_range_batch requires POST")
	}

	body, err := io.ReadAll(io.LimitReader(req.Body, 1<<20))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "unable to read body")
	}
	_ = req.Body.Close()

	var batchReq rangeQueryBatchRequest
	if err := json.Unmarshal(body, &batchReq); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid JSON body: %v", err))
	}
	if len(batchReq.Queries) == 0 {
		out := rangeQueryBatchResponse{Status: "success"}
		out.Data.Results = map[string]json.RawMessage{}
		return c.JSON(http.StatusOK, out)
	}
	if len(batchReq.Queries) > maxBatchQueries {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("too many queries (max %d)", maxBatchQueries))
	}
	for _, q := range batchReq.Queries {
		if strings.TrimSpace(q.ID) == "" || strings.TrimSpace(q.Query) == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "each query requires non-empty id and query")
		}
	}

	if err := h.prepareRequest(c); err != nil {
		h.logWithDefaultEntry().WithError(err).Error("unable to prepare the HTTP request for query_range_batch")
		return err
	}

	transport, err := h.prepareTransport()
	if err != nil {
		return err
	}
	client := &http.Client{Transport: transport, Timeout: defaultBatchTimeout}

	ctx, cancel := context.WithTimeout(req.Context(), defaultBatchTimeout)
	defer cancel()

	// Headers after prepareRequest (Authorization, custom headers, …).
	authHeaders := req.Header.Clone()

	baseURL := *h.config.URL.URL
	results := make(map[string]json.RawMessage, len(batchReq.Queries))
	var mu sync.Mutex
	sem := make(chan struct{}, defaultBatchConcurrency)
	var wg sync.WaitGroup

	for _, item := range batchReq.Queries {
		wg.Add(1)
		go func(item rangeQueryBatchItem) {
			defer wg.Done()
			select {
			case sem <- struct{}{}:
				defer func() { <-sem }()
			case <-ctx.Done():
				mu.Lock()
				results[item.ID] = jsonErrorResult("timeout", ctx.Err().Error())
				mu.Unlock()
				return
			}
			raw := h.upstreamQueryRange(ctx, client, &baseURL, authHeaders, batchReq, item)
			mu.Lock()
			results[item.ID] = raw
			mu.Unlock()
		}(item)
	}
	wg.Wait()

	out := rangeQueryBatchResponse{Status: "success"}
	out.Data.Results = results
	return c.JSON(http.StatusOK, out)
}

func (h *httpProxy) upstreamQueryRange(
	ctx context.Context,
	client *http.Client,
	baseURL *url.URL,
	authHeaders http.Header,
	batch rangeQueryBatchRequest,
	item rangeQueryBatchItem,
) json.RawMessage {
	form := url.Values{}
	form.Set("query", item.Query)
	form.Set("start", batch.Start.String())
	form.Set("end", batch.End.String())
	form.Set("step", batch.Step.String())
	if batch.Timeout != "" {
		form.Set("timeout", batch.Timeout)
	}

	u := *baseURL
	u.Path = joinURLPath(strings.TrimSuffix(baseURL.Path, "/"), queryRangePathSuffix)
	u.RawQuery = ""

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u.String(), strings.NewReader(form.Encode()))
	if err != nil {
		return jsonErrorResult("internal", err.Error())
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	for k, vals := range authHeaders {
		lk := strings.ToLower(k)
		if lk == "content-length" || lk == "content-type" || lk == "host" {
			continue
		}
		for _, v := range vals {
			req.Header.Add(k, v)
		}
	}
	req.Host = baseURL.Host

	res, err := client.Do(req)
	if err != nil {
		return jsonErrorResult("transport", err.Error())
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 32<<20))
	if err != nil {
		return jsonErrorResult("transport", err.Error())
	}
	if res.StatusCode >= 400 {
		if json.Valid(body) {
			return json.RawMessage(body)
		}
		return jsonErrorResult("upstream", fmt.Sprintf("HTTP %d: %s", res.StatusCode, truncateStr(string(body), 500)))
	}
	if !json.Valid(body) {
		return jsonErrorResult("upstream", "invalid JSON from query_range")
	}
	return json.RawMessage(body)
}

func jsonErrorResult(errType, msg string) json.RawMessage {
	b, _ := json.Marshal(map[string]any{
		"status":    "error",
		"errorType": errType,
		"error":     msg,
	})
	return b
}

func joinURLPath(base, rel string) string {
	base = strings.TrimSuffix(base, "/")
	if !strings.HasPrefix(rel, "/") {
		rel = "/" + rel
	}
	if base == "" {
		return rel
	}
	return base + rel
}

func truncateStr(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
