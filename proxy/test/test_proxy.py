import wsgiref.util

import flask

from proxy import proxy

# pylint: disable=W0212


def test_happy_path():
    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/locationforecast/1.9/",
        "QUERY_STRING": "lat=59.31895603;lon=18.0517762",
        "HTTP_REFERER": "https://walles.github.io/weatherclock",
    }
    wsgiref.util.setup_testing_defaults(environ)

    request = flask.Request(environ)
    proxy._proxy_request(request)
