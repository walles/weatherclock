import wsgiref.util

import flask

from proxy import proxy

# pylint: disable=W0212


def test_happy_path():
    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/locationforecast/2.0/classic",
        "QUERY_STRING": "lat=59.31895603;lon=18.0517762",
        "HTTP_REFERER": "https://walles.github.io/weatherclock",
        "HTTP_USER_AGENT": "github.com/walles/weatherclock tox tests",
    }
    wsgiref.util.setup_testing_defaults(environ)

    request = flask.Request(environ)
    proxy._proxy_request(request)
