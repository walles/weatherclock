package proxy

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHappyPath(t *testing.T) {
	const requestPath = "/weatherapi/locationforecast/2.0/compact"
	const responseBody = "Imagine weather data here"
	const shouldBeDroppedHeader = "Transfer-Encoding"

	// Set up a mock yr.no API endpoint
	testServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Check the request
		if req.URL.Path != requestPath {
			t.Errorf("expected path %s, got %s", requestPath, req.URL.Path)
		}
		if req.Header.Get(shouldBeDroppedHeader) != "" {
			t.Errorf("expected no %s header, got %s", shouldBeDroppedHeader, req.Header.Get(shouldBeDroppedHeader))
		}

		// Write the response
		res.WriteHeader(200)
		_, err := res.Write([]byte(responseBody))
		if err != nil {
			t.Fatal(err)
		}
	}))
	defer func() { testServer.Close() }()

	// Create a new request
	req, err := http.NewRequest(http.MethodGet, requestPath+"?lat=60.10&lon=9.58", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set(shouldBeDroppedHeader, "this header should be dropped")

	// Send the request to the proxy
	rr := httptest.NewRecorder()
	proxyRequest(testServer.URL, rr, req)

	// Check the response
	if rr.Code != 200 {
		t.Errorf("expected status code 200, got %d", rr.Code)
	}
	if rr.Body.String() != responseBody {
		t.Errorf("expected body '%s', got %s", responseBody, rr.Body.String())
	}
}
