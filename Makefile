CURRENT_DIRECTORY := $(shell pwd)
SHELL:=/bin/bash

prepare_local_env:
	( \
		python3 -m venv env; \
		source env/bin/activate; \
		pip3 install -r requirements.txt; \
	)

.PHONY: prepare_local_env