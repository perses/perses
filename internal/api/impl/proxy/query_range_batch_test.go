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
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
)

func TestServeQueryRangeBatch_FanOut(t *testing.T) {
	var hits atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		if r.URL.Path != "/api/v1/query_range" {
			t.Errorf("unexpected path %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Errorf("unexpected method %s", r.Method)
		}
		_ = r.ParseForm()
		q := r.Form.Get("query")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"__name__":"` + q + `"},"values":[[1,"1"]]}]}}`))
	}))
	defer upstream.Close()

	h := &httpProxy{
		config: &datasourceHTTP.Config{
			URL: common.MustParseURL(upstream.URL),
		},
		datasourceName: "prom",
		path:           "/api/v1/query_range_batch",
	}

	body := []byte(`{
		"start": 1000,
		"end": 2000,
		"step": 15,
		"queries": [
			{"id": "0", "query": "up"},
			{"id": "1", "query": "node_cpu"}
		]
	}`)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/proxy/test", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.serveQueryRangeBatch(c); err != nil {
		t.Fatalf("serveQueryRangeBatch: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if hits.Load() != 2 {
		t.Fatalf("expected 2 upstream hits, got %d", hits.Load())
	}

	var resp rangeQueryBatchResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.Status != "success" {
		t.Fatalf("status %s", resp.Status)
	}
	if len(resp.Data.Results) != 2 {
		t.Fatalf("results len %d", len(resp.Data.Results))
	}
	for _, id := range []string{"0", "1"} {
		raw, ok := resp.Data.Results[id]
		if !ok {
			t.Fatalf("missing id %s", id)
		}
		var one map[string]any
		if err := json.Unmarshal(raw, &one); err != nil {
			t.Fatal(err)
		}
		if one["status"] != "success" {
			t.Fatalf("id %s status %v", id, one["status"])
		}
	}
}

func TestServeQueryRangeBatch_PartialError(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		if r.Form.Get("query") == "bad" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"status":"error","errorType":"bad_data","error":"parse error"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"status":"success","data":{"resultType":"matrix","result":[]}}`)
	}))
	defer upstream.Close()

	h := &httpProxy{
		config:         &datasourceHTTP.Config{URL: common.MustParseURL(upstream.URL)},
		datasourceName: "prom",
		path:           "/api/v1/query_range_batch",
	}

	body := []byte(`{
		"start": 1, "end": 2, "step": 1,
		"queries": [
			{"id": "ok", "query": "up"},
			{"id": "ko", "query": "bad"}
		]
	}`)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.serveQueryRangeBatch(c); err != nil {
		t.Fatal(err)
	}
	var resp rangeQueryBatchResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	okRaw := resp.Data.Results["ok"]
	koRaw := resp.Data.Results["ko"]
	var okMap, koMap map[string]any
	_ = json.Unmarshal(okRaw, &okMap)
	_ = json.Unmarshal(koRaw, &koMap)
	if okMap["status"] != "success" {
		t.Fatalf("ok=%v", okMap)
	}
	if koMap["status"] != "error" {
		t.Fatalf("ko=%v", koMap)
	}
}

func TestPathForAllowlist(t *testing.T) {
	if got := pathForAllowlist("/api/v1/query_range_batch"); got != "/api/v1/query_range" {
		t.Fatalf("got %s", got)
	}
	if got := pathForAllowlist("/api/v1/query_range"); got != "/api/v1/query_range" {
		t.Fatalf("got %s", got)
	}
}

func TestIsQueryRangeBatchPath(t *testing.T) {
	if !isQueryRangeBatchPath("/api/v1/query_range_batch") {
		t.Fatal("expected true")
	}
	if isQueryRangeBatchPath("/api/v1/query_range") {
		t.Fatal("expected false")
	}
}

func TestServeQueryRangeBatch_EmptyQueries(t *testing.T) {
	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL("http://127.0.0.1:9")},
		path:   "/api/v1/query_range_batch",
	}
	body := []byte(`{"start":1,"end":2,"step":1,"queries":[]}`)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	if err := h.serveQueryRangeBatch(e.NewContext(req, rec)); err != nil {
		t.Fatal(err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("code %d", rec.Code)
	}
	var resp rangeQueryBatchResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp.Status != "success" || len(resp.Data.Results) != 0 {
		t.Fatalf("%+v", resp)
	}
}

func TestServeQueryRangeBatch_ValidationErrors(t *testing.T) {
	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL("http://127.0.0.1:9")},
		path:   "/api/v1/query_range_batch",
	}
	e := echo.New()

	// GET not allowed
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	err := h.serveQueryRangeBatch(e.NewContext(req, rec))
	if err == nil {
		t.Fatal("expected method error")
	}

	// invalid JSON
	req = httptest.NewRequest(http.MethodPost, "/", bytes.NewReader([]byte(`{`)))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	err = h.serveQueryRangeBatch(e.NewContext(req, httptest.NewRecorder()))
	if err == nil {
		t.Fatal("expected json error")
	}

	// empty id
	body := []byte(`{"start":1,"end":2,"step":1,"queries":[{"id":"","query":"up"}]}`)
	req = httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	err = h.serveQueryRangeBatch(e.NewContext(req, httptest.NewRecorder()))
	if err == nil {
		t.Fatal("expected empty id error")
	}

	// too many queries
	type qItem struct {
		ID    string `json:"id"`
		Query string `json:"query"`
	}
	tooMany := struct {
		Start   int     `json:"start"`
		End     int     `json:"end"`
		Step    int     `json:"step"`
		Queries []qItem `json:"queries"`
	}{Start: 1, End: 2, Step: 1}
	for i := 0; i <= maxBatchQueries; i++ {
		tooMany.Queries = append(tooMany.Queries, qItem{ID: "q", Query: "up"})
	}
	big, _ := json.Marshal(tooMany)
	req = httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(big))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	err = h.serveQueryRangeBatch(e.NewContext(req, httptest.NewRecorder()))
	if err == nil {
		t.Fatal("expected too many queries error")
	}
}

func TestServeQueryRangeBatch_ForwardsFormFields(t *testing.T) {
	var gotQuery, gotStart, gotEnd, gotStep string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		gotQuery = r.Form.Get("query")
		gotStart = r.Form.Get("start")
		gotEnd = r.Form.Get("end")
		gotStep = r.Form.Get("step")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[]}}`))
	}))
	defer upstream.Close()

	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL(upstream.URL)},
		path:   "/api/v1/query_range_batch",
	}
	body := []byte(`{"start":100,"end":200,"step":15,"queries":[{"id":"x","query":"sum(up)"}]}`)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	if err := h.serveQueryRangeBatch(e.NewContext(req, rec)); err != nil {
		t.Fatal(err)
	}
	if gotQuery != "sum(up)" || gotStart != "100" || gotEnd != "200" || gotStep != "15" {
		t.Fatalf("form query=%q start=%q end=%q step=%q", gotQuery, gotStart, gotEnd, gotStep)
	}
}

func TestJoinURLPathAndTruncate(t *testing.T) {
	if joinURLPath("/prom", "/api/v1/query_range") != "/prom/api/v1/query_range" {
		t.Fatal(joinURLPath("/prom", "/api/v1/query_range"))
	}
	if joinURLPath("", "api/v1/query_range") != "/api/v1/query_range" {
		t.Fatal(joinURLPath("", "api/v1/query_range"))
	}
	if truncateStr("abcdef", 3) != "abc..." {
		t.Fatal(truncateStr("abcdef", 3))
	}
	if truncateStr("ab", 5) != "ab" {
		t.Fatal(truncateStr("ab", 5))
	}
}

func TestServe_InterceptsBatchPath(t *testing.T) {
	var hits atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[]}}`))
	}))
	defer upstream.Close()

	h := &httpProxy{
		config: &datasourceHTTP.Config{
			URL: common.MustParseURL(upstream.URL),
		},
		datasourceName: "prom",
		path:           "/api/v1/query_range_batch",
	}

	body := []byte(`{"start":1,"end":2,"step":1,"queries":[{"id":"a","query":"up"},{"id":"b","query":"up"}]}`)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/proxy/x/api/v1/query_range_batch", bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.serve(c); err != nil {
		t.Fatalf("serve: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
	}
	if hits.Load() != 2 {
		t.Fatalf("hits %d", hits.Load())
	}
	var resp rangeQueryBatchResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if len(resp.Data.Results) != 2 {
		t.Fatalf("results %d", len(resp.Data.Results))
	}
}
