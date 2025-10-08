args=$(filter-out $@,$(MAKECMDGOALS))

.EXPORT_ALL_VARIABLES:

ENV_FILE ?= .env
PROJECT=ventidole

# export .env file
-include $(ENV_FILE)
export

all: help ## show all targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

help: ## show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

dev: ## start server
	docker compose -f ./docker/local/docker-compose.yaml -p $(PROJECT) up $(args) -d ${SERVICE}

build: ## start server
	docker compose -f ./docker/local/docker-compose.yaml -p $(PROJECT) up $(args) --build -d ${SERVICE}

down: ## stop server
	docker compose -f ./docker/local/docker-compose.yaml -p $(PROJECT) down

deploy-develop:
	bash ./scripts/deploy.sh dev $(PROJECT)

deploy-production:
	bash ./scripts/deploy.sh prod $(PROJECT)