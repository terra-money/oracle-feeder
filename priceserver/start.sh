#!/usr/bin/env bash

export PYTHONPATH=${PYTHONPATH:-.}
export FLASK_ENV=${FLASK_ENV:-develop}

case "${FLASK_ENV}" in
    production) FLASK_APP=application.py flask run --port=7658 --eager-loading $*;;
             *) FLASK_APP=application.py FLASK_DEBUG=1 flask run --port=5000 --eager-loading $*;;
esac
