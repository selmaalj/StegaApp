CURRENT_DIRECTORY := $(shell pwd)
SHELL:=/bin/bash

prepare_local_env:
	( \
		python3 -m venv env; \
		source env/bin/activate; \
		pip3 install -r requirements.txt; \
		wget http://people.eecs.berkeley.edu/~tancik/stegastamp/saved_models.tar.xz; \
        tar -xJf saved_models.tar.xz; \
        rm saved_models.tar.xz; \
	)

.PHONY: prepare_local_env