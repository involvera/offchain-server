#!/bin/bash
echo "yarn dockerfile           : build API server image"
echo "yarn docker-compose       : start API server and database container"
echo "yarn docker-rm-volumes    : remove the migration history, maria database, logs and all user data"
echo "yarn docker-stop-db       : stop and rm the maria container"
echo "yarn docker-stop-server   : stop and rm the API server container"
echo "yarn docker-stop          : stop and rm the API server and maria container"
echo "yarn docker-reset         : /!\ yarn docker-stop + yarn docker-rm-volumes /!\\" 
