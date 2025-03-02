/*
Proxy requests to api.yr.no so that they can be accessed from web pages.

To deploy, upload the contents of this file to Google Cloud Run:
https://console.cloud.google.com/run/detail/europe-north1/api-met-no-proxy-go/source?inv=1&invt=Abq9XQ&project=api-met-no-proxy
*/

package proxy

import (
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"
)

func headersToValue(header http.Header) slog.Value {
	var headers []slog.Attr
	for key, values := range header {
		headers = append(headers, slog.String(key, strings.Join(values, ",")))
	}
	return slog.GroupValue(headers...)
}

var log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
		// Translate from Go to GCP log field names
		// https://go.dev/blog/slog
		// https://cloud.google.com/logging/docs/agent/logging/configuration#special-fields
		if a.Key == "level" {
			a.Key = "severity"
		}
		if a.Key == "msg" {
			a.Key = "message"
		}

		// Special handle http.Request type fields
		if r, ok := a.Value.Any().(*http.Request); ok {
			// Field names from here:
			// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#HttpRequest
			a.Value = slog.GroupValue(
				slog.String("requestMethod", r.Method),
				slog.String("requestUrl", r.URL.String()),
				slog.String("protocol", r.Proto),
				slog.String("remoteIp", r.RemoteAddr),
				slog.Attr{
					Key:   "headers",
					Value: headersToValue(r.Header),
				},
			)
		}

		if r, ok := a.Value.Any().(*http.Response); ok {
			a.Value = slog.GroupValue(
				slog.String("requestMethod", r.Request.Method),
				slog.String("requestUrl", r.Request.URL.String()),
				slog.String("protocol", r.Proto),
				slog.String("status", r.Status),
				slog.Int64("responseSize", r.ContentLength),
				slog.Attr{
					Key:   "headers",
					Value: headersToValue(r.Header),
				},
			)
		}

		return a
	},
}))

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

func ProxyRequest(w http.ResponseWriter, r *http.Request) {
	proxyRequest("https://api.met.no/weatherapi", w, r)
}

// Remove hop-by-hop headers:
// https://www.freesoft.org/CIE/RFC/2068/143.htm
func dropHopByHopHeaders(header http.Header) {
	header.Del("Connection")
	header.Del("Keep-Alive")
	header.Del("Proxy-Authenticate")
	header.Del("Proxy-Authorization")
	header.Del("TE")
	header.Del("Trailer")
	header.Del("Transfer-Encoding")
	header.Del("Upgrade")
}

func proxyRequest(yrNoAPIBaseURL string, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Error("Method must be GET", "httpRequest", r)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Create a new request to the API
	yrRequest, err := http.NewRequest(r.Method, yrNoAPIBaseURL+r.URL.Path, r.Body)
	if err != nil {
		log.Error("Failed to create upstream request from incoming", "error", err, "httpRequest", r)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy the query parameters from the original request
	yrRequest.URL.RawQuery = r.URL.RawQuery

	// Copy the headers from the original request
	yrRequest.Header = r.Header.Clone()
	dropHopByHopHeaders(yrRequest.Header)

	// Send the request to the API
	yrResponse, err := httpClient.Do(yrRequest)
	if err != nil {
		log.Error("Failed to send outgoing request", "error", err, "httpRequest", r, "outgoing", yrRequest)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer yrResponse.Body.Close()

	// Copy the response headers
	for key, values := range yrResponse.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	dropHopByHopHeaders(w.Header())

	// Allow using from JavaScript
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Copy the response status code
	w.WriteHeader(yrResponse.StatusCode)

	// Tell the client to cache forecasts for two hours, they are unlikely to
	// change much.
	w.Header().Set("Cache-Control", "public, max-age=7200")

	// Copy the response body
	_, err = io.Copy(w, yrResponse.Body)
	if err != nil {
		log.Error("Failed to copy response body", "error", err, "httpRequest", r, "yrResponse", yrResponse)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Info("Request handled", "httpRequest", r, "yrResponse", yrResponse)
}
