"""
Proxy requests to api.yr.no so that they can be accessed from web pages.

To deploy, upload the contents of this file to Google Cloud Run:
https://console.cloud.google.com/run/detail/europe-north1/api-met-no-proxy/source?inv=1&invt=Abq2CA&project=api-met-no-proxy
"""

import json
import traceback
import http.client
import urllib.request

from enum import Enum

import flask
import functions_framework
import werkzeug.datastructures

UPSTREAM_TIMEOUT_SECONDS = 5

# From: https://www.freesoft.org/CIE/RFC/2068/143.htm
HOP_BY_HOP_HEADERS = [
    "connection",
    "keep-alive",
    "public",
    "proxy-authenticate",
    "transfer-encoding",
    "upgrade",
]


class Severity(Enum):
    """
    Ref: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
    """

    INFO = "INFO"
    ERROR = "ERROR"


def log(severity: Severity, message: str):
    """
    Ref: https://cloud.google.com/run/docs/logging#run_manual_logging-python
    """
    print(
        json.dumps(
            {
                "severity": severity.value,
                "message": message,
            }
        )
    )


def to_upstream_request(incoming: flask.Request) -> urllib.request.Request:
    # Example result we're shooting for:
    # https://api.met.no/weatherapi/locationforecast/1.9/?lat=12;lon=34
    upstream_url: str = (
        "https://api.met.no/weatherapi"
        + incoming.path
        + "?"
        + incoming.query_string.decode("utf-8")
    )

    outgoing_headers = {}
    for header, value in incoming.headers.items():
        if header.lower() in HOP_BY_HOP_HEADERS:
            continue
        outgoing_headers[header] = value
    outgoing_headers["Host"] = "api.met.no"

    if incoming.remote_addr:
        outgoing_headers["X-Forwarded-For"] = incoming.remote_addr

    return urllib.request.Request(upstream_url, headers=outgoing_headers)


def get_upstream_response(request: urllib.request.Request) -> http.client.HTTPResponse:
    return urllib.request.urlopen(request, timeout=UPSTREAM_TIMEOUT_SECONDS)


def to_downstream_response(
    upstream_response: http.client.HTTPResponse,
) -> flask.Response:
    response_headers = werkzeug.datastructures.Headers()
    for header, value in upstream_response.getheaders():
        if header.lower() in HOP_BY_HOP_HEADERS:
            continue
        response_headers.add(header, value)

    # Allow use from Javascript
    response_headers.set("Access-Control-Allow-Origin", "*")
    response_headers.set("Access-Control-Allow-Methods", "GET")

    # Cache forecasts for half an hour, they are unlikely to change that much
    response_headers.set("Cache-Control", "public, max-age=1800")

    return flask.Response(
        response=upstream_response.read(),
        status=upstream_response.status,
        headers=response_headers,
    )


def _proxy_request(request: flask.Request):
    log(Severity.INFO, f"Incoming request: {request}")
    log(Severity.INFO, f"  Incoming headers: {json.dumps(dict(request.headers))}")
    if request.method != "GET":
        raise Exception(f"Method must be GET: <{request.method}>")

    upstream_request = to_upstream_request(request)
    log(Severity.INFO, f"Request to upstream: {vars(upstream_request)}")

    upstream_response = get_upstream_response(upstream_request)
    log(Severity.INFO, f"Response from upstream: {vars(upstream_response)}")

    response = to_downstream_response(upstream_response)
    log(Severity.INFO, f"Responding with: {response}")
    log(Severity.INFO, f"  Response headers: {json.dumps(dict(response.headers))}")

    return response


@functions_framework.http
def proxy_request(request: flask.Request):
    try:
        return _proxy_request(request)
    except Exception:
        details = traceback.format_exc()
        log(Severity.ERROR, f"Handling request failed: {request}\n{details}")

        return flask.Response(
            "Request handling failed, ask johan.walles@gmail.com for details",
            status=500,
            mimetype="text/plain",
        )
