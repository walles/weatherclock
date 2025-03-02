/*
Proxy requests to api.yr.no so that they can be accessed from web pages.

To deploy, upload the contents of this file to Google Cloud Run:
https://console.cloud.google.com/run/detail/europe-north1/api-met-no-proxy/source?inv=1&invt=Abq2CA&project=api-met-no-proxy
*/

package proxy

import (
	"io"
	"net/http"
	"time"
)

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

func ProxyRequest(w http.ResponseWriter, r *http.Request) {
	proxyRequest("https://api.met.no/weatherapi", w, r)
}

func proxyRequest(yrNoAPIBaseURL string, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Create a new request to the API
	req, err := http.NewRequest(r.Method, yrNoAPIBaseURL+r.URL.Path, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy the query parameters from the original request
	req.URL.RawQuery = r.URL.RawQuery

	// Copy the headers from the original request
	req.Header = r.Header

	// Remove hop-by-hop headers:
	// https://www.freesoft.org/CIE/RFC/2068/143.htm
	req.Header.Del("Connection")
	req.Header.Del("Keep-Alive")
	req.Header.Del("Proxy-Authenticate")
	req.Header.Del("Proxy-Authorization")
	req.Header.Del("TE")
	req.Header.Del("Trailer")
	req.Header.Del("Transfer-Encoding")
	req.Header.Del("Upgrade")

	// Send the request to the API
	resp, err := httpClient.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy the response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Allow using from JavaScript
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Copy the response status code
	w.WriteHeader(resp.StatusCode)

	// Tell the client to cache forecasts for two hours, they are unlikely to
	// change much.
	w.Header().Set("Cache-Control", "public, max-age=7200")

	// Copy the response body
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
