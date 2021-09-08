package middleware

import (
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/sirupsen/logrus"
)

var (
	proxyMatcher                       = regexp.MustCompile(`/proxy/datasources/([a-zA-Z-0-9_-]+)(/.*)`)
	defaultTransport http.RoundTripper = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			DualStack: true,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
	}
)

func Proxy(dao datasource.DAO) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			targetURL, err := buildProxy(c, dao)
			if err != nil {
				return err
			}
			if targetURL == nil {
				return next(c)
			}
			return serveProxy(c, targetURL)
		}
	}
}

func buildProxy(c echo.Context, dao datasource.DAO) (*url.URL, error) {
	req := c.Request()
	requestPath := req.URL.Path
	if !proxyMatcher.MatchString(requestPath) {
		// request is not matching the proxy path. Probably it's a request to the API itself
		// That's why no error is returned in order to let the request passed.
		return nil, nil
	}
	logrus.Tracef("'%s' is a request to a datasource", requestPath)
	matchingGroups := proxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 1 {
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	datasourceName := matchingGroups[0][1]
	// getting the datasource object
	dts, err := dao.Get(datasourceName)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource '%s'", datasourceName)
			return nil, echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("unable to forward the request to the datasource '%s', datasource doesn't exist", datasourceName))
		}
		logrus.WithError(err).Errorf("unable to find the datasource '%s', something wrong with the database", datasourceName)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	var path string
	if len(matchingGroups[0]) > 1 {
		path = matchingGroups[0][2]
	}

	// redirect the request to the datasource
	req.URL.Path = path
	return dts.Spec.URL, nil
}

func serveProxy(c echo.Context, targetURL *url.URL) error {
	req := c.Request()
	res := c.Response()

	// We have to modify the HOST of the request in order to match the host of the targetURL
	// So far I'm not sure to understand exactly why, but if you are going to remove it, be sure of what you are doing.
	// It has been done to fix an error returned by Openshift itself saying the target doesn't exist.
	// Since we are using HTTP/1, setting the HOST is setting also an header so if the host and the header is blocked
	// then maybe it is blocked by the Openshift router.
	req.Host = targetURL.Host
	// Fix header
	if len(req.Header.Get(echo.HeaderXRealIP)) == 0 {
		req.Header.Set(echo.HeaderXRealIP, c.RealIP())
	}
	if len(req.Header.Get(echo.HeaderXForwardedProto)) == 0 {
		req.Header.Set(echo.HeaderXForwardedProto, c.Scheme())
	}
	proxyHTTP(c, targetURL).ServeHTTP(res, req)
	if e, ok := c.Get("_error").(error); ok {
		return e
	}
	return nil
}

func proxyHTTP(c echo.Context, targetURL *url.URL) http.Handler {
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.ErrorHandler = func(writer http.ResponseWriter, request *http.Request, err error) {
		desc := targetURL.String()
		msg := fmt.Sprintf("remote %s is unreachable, could not forward: %v", desc, err)
		logrus.Errorf(msg)
		c.Set("_error", echo.NewHTTPError(http.StatusBadGateway, msg))
	}
	// use the dedicated HTTP transport to avoid any TSL encrypt issue
	proxy.Transport = defaultTransport
	return proxy
}
