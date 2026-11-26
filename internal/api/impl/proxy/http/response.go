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

package httpproxy

import (
	"net/http"
	"net/url"
	"strings"
)

// The response of a datasource is served by the proxy under the origin of Perses. Without restriction, a datasource
// (or anyone controlling its response) could:
//   - serve a page (HTML, SVG...) whose scripts run with the origin of Perses, and so use the API with the session of
//     the user opening a link to the datasource (Cross-Site Scripting);
//   - serve a script that a page of the UI would run with the origin of Perses: the Content-Security-Policy of the UI
//     allows the scripts of the Perses origin ('self'), which includes the proxy;
//   - set or clear the cookies of Perses, including the session (session fixation, logout);
//   - redirect the user to any website (open redirect);
//   - define security policies for the Perses domain (HSTS, alternative services, CORS...).
//
// The Perses UI and the plugins only query the proxy with fetch / XHR, for which the browser ignores the security
// policies of the response (Content-Security-Policy). Restricting them has therefore no impact on Perses itself.

const (
	// proxiedResponseCSP is the Content-Security-Policy of every response of the proxy.
	// "sandbox" makes the browser treat a document loaded from the proxy as coming from a unique, opaque origin, without
	// scripts, forms, popups or top-level navigation: it cannot access the Perses origin (cookies, storage, API).
	// "default-src 'none'" forbids loading any resource from such a document, and "frame-ancestors 'none'" forbids
	// embedding it in a frame.
	proxiedResponseCSP = "sandbox; default-src 'none'; frame-ancestors 'none'"
	// corsHeaderPrefix is the prefix of the CORS response headers.
	// The CORS policy of Perses is defined by its configuration (security.cors), not by the datasources.
	corsHeaderPrefix = "Access-Control-"
)

// removedResponseHeaders are the headers of the datasource response that would apply to the Perses origin (or domain),
// and are therefore never forwarded to the client.
var removedResponseHeaders = []string{
	"Set-Cookie",                          // the browser would store the cookies of the datasource for the Perses origin, overriding the Perses ones (e.g. the session)
	"Set-Cookie2",                         // obsolete, but still removed
	"Clear-Site-Data",                     // would clear the cookies (session) and the storage of Perses
	"Refresh",                             // redirection, like Location
	"Strict-Transport-Security",           // HSTS policy of the Perses domain (and possibly its subdomains)
	"Alt-Svc",                             // alternative services used to reach the Perses origin
	"Service-Worker-Allowed",              // would widen the scope of a service worker
	"Content-Security-Policy",             // replaced by proxiedResponseCSP
	"Content-Security-Policy-Report-Only", // only the policy of Perses applies
	"X-Content-Type-Options",              // replaced by "nosniff"
}

// locationHeaders are the response headers containing a URL the browser can follow (Location) or use to resolve
// other URLs (Content-Location).
var locationHeaders = []string{"Location", "Content-Location"}

// scriptDestinations are the values of the Sec-Fetch-Dest request header sent by the browsers to load a script:
// a <script> element (classic or module), a worker or a worklet.
var scriptDestinations = map[string]bool{
	"script":        true,
	"worker":        true,
	"sharedworker":  true,
	"serviceworker": true,
	"audioworklet":  true,
	"paintworklet":  true,
}

// javaScriptMIMETypes are the JavaScript MIME types (https://mimesniff.spec.whatwg.org/#javascript-mime-type).
// With "X-Content-Type-Options: nosniff", the browsers only run a response as a script when its type is one of them.
var javaScriptMIMETypes = map[string]bool{
	"application/ecmascript":   true,
	"application/javascript":   true,
	"application/x-ecmascript": true,
	"application/x-javascript": true,
	"text/ecmascript":          true,
	"text/javascript":          true,
	"text/javascript1.0":       true,
	"text/javascript1.1":       true,
	"text/javascript1.2":       true,
	"text/javascript1.3":       true,
	"text/javascript1.4":       true,
	"text/javascript1.5":       true,
	"text/jscript":             true,
	"text/livescript":          true,
	"text/x-ecmascript":        true,
	"text/x-javascript":        true,
}

// isScriptDestination tells if the browser sends the request to load a script (Sec-Fetch-Dest), which the proxy
// refuses: the response of a datasource must never run as a script of the Perses origin. For the browsers that don't
// send this header, secureResponse serves the JavaScript responses as plain text, which they refuse to run.
func isScriptDestination(req *http.Request) bool {
	return scriptDestinations[strings.ToLower(req.Header.Get("Sec-Fetch-Dest"))]
}

// isJavaScript tells if one of the given Content-Type values is a JavaScript MIME type. Like the browsers, which read
// the values of the header as a comma-separated list, it ignores the case, the parameters and the whitespaces.
func isJavaScript(contentTypes []string) bool {
	for _, value := range contentTypes {
		for _, mediaType := range strings.Split(value, ",") {
			essence, _, _ := strings.Cut(mediaType, ";")
			if javaScriptMIMETypes[strings.ToLower(strings.TrimSpace(essence))] {
				return true
			}
		}
	}
	return false
}

// secureResponse removes or overrides the headers of the datasource response that would apply to the Perses origin.
// It is meant to be used as the ModifyResponse function of the reverse proxy, so it only applies to the headers
// coming from the datasource: the ones set by Perses itself (e.g. by the CORS middleware) are kept.
func secureResponse(resp *http.Response) error {
	header := resp.Header
	for name := range header {
		// The keys of the response headers are canonicalized (e.g. "Access-Control-Allow-Origin").
		if strings.HasPrefix(name, corsHeaderPrefix) {
			delete(header, name)
		}
	}
	for _, name := range removedResponseHeaders {
		header.Del(name)
	}
	for _, name := range locationHeaders {
		for _, value := range header.Values(name) {
			if !isRelativeLocation(value) {
				// An absolute location (even to the datasource itself) would make the proxy an open redirect
				// from the Perses origin, as the datasource URL is defined by the users.
				header.Del(name)
				break
			}
		}
	}
	header.Set("Content-Security-Policy", proxiedResponseCSP)
	header.Set("X-Content-Type-Options", "nosniff")
	if isJavaScript(header.Values("Content-Type")) {
		// With "nosniff", a response whose type isn't a JavaScript MIME type can't run as a script.
		header.Set("Content-Type", "text/plain")
	}
	return nil
}

// isRelativeLocation returns true if the location is a relative reference without host (e.g. "/graph" or "graph"),
// so the browser resolves it against the Perses origin.
func isRelativeLocation(location string) bool {
	// Browsers ignore the tabs and newlines in a URL, and consider the backslashes as slashes ("/\evil.com" is "//evil.com").
	normalized := strings.NewReplacer("\t", "", "\r", "", "\n", "", "\\", "/").Replace(strings.TrimSpace(location))
	if strings.HasPrefix(normalized, "//") {
		// Scheme-relative location ("//evil.com"), including "///evil.com" that browsers consider as "//evil.com".
		return false
	}
	u, err := url.Parse(normalized)
	if err != nil {
		return false
	}
	return len(u.Scheme) == 0 && len(u.Host) == 0 && u.User == nil
}
