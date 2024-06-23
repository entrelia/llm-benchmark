#!make
ifneq (,$(wildcard ./.env.local))
    include .env.local
    export
endif

DOCKER := docker

.PHONY: run-openai
run-openai:
	mkdir -p out
	$(DOCKER) run --rm -i \
	-e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=out/report-openai.html -v ${PWD}:/k6 -w /k6 \
	-e TARGET_API_TYPE=openai -e TARGET_HOSTNAME=$(TARGET_IP):8000 \
	grafana/k6 run script.js

.PHONY: run-ollama
run-ollama:
	mkdir -p out
	$(DOCKER) run --rm -i \
	-e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=out/report-ollama.html -v ${PWD}:/k6 -w /k6 \
	-e TARGET_API_TYPE=ollama -e TARGET_HOSTNAME=$(TARGET_IP):11434 \
	grafana/k6 run script.js