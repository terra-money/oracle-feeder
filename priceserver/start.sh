#!/usr/bin/env bash

PYTHONPATH=${PYTHONPATH}:.

case "${FLASK_ENV}" in
    production) FLASK_APP=application.py flask run --port=7658 --without-threads --eager-loading $*;;
             *) FLASK_APP=application.py FLASK_DEBUG=1 flask run --port=5000 --without-threads --eager-loading $*;;
esac
