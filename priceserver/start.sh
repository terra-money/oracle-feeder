#!/usr/bin/env bash
case "${FLASK_ENV}" in
    production) FLASK_APP=serv.py flask run --port=7658 --without-threads --eager-loading $*;;
             *) FLASK_APP=serv.py FLASK_DEBUG=1 flask run --port=5000 --without-threads --eager-loading $*;;
esac