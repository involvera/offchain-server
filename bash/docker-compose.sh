#!/bin/bash

############## FIND PROJECT DIRECTORY ###########

platform=$(uname)
if [ "$platform" = "Linux" ];
then
    SCRIPT_DIR="$( dirname -- "$( readlink -f -- "$0"; )")"
else
    SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
fi
DIR_NAME=$(dirname $SCRIPT_DIR);

############## JSON FILES PATH ###########

JSON_CONFIG_PATH=$DIR_NAME"/config.json" 
DOCKERCOMPOSE_PATH=$DIR_NAME"/docker-compose.yml" 
SQL_SCRIPT_PATH=$DIR_NAME"/init-script.sql" 

############## VARIABLES INIT ###########

DB_HOST=$(jq ".mysql.host" $JSON_CONFIG_PATH | sed 's/\"//g')
DB_NAME=$(jq ".mysql.database" $JSON_CONFIG_PATH | sed 's/\"//g')
DB_USER=$(jq ".mysql.user" $JSON_CONFIG_PATH | sed 's/\"//g')
DB_PASSWD=$(jq ".mysql.password" $JSON_CONFIG_PATH | sed 's/\"//g')
PORT=$(jq ".port" $JSON_CONFIG_PATH)
HISTORY_PATH=$(jq ".history_dir_path" $JSON_CONFIG_PATH | sed 's/\"//g')
ASSETS_PATH=$(jq ".assets_dir_path" $JSON_CONFIG_PATH | sed 's/\"//g')

if [ "$DB_HOST" != "maria" ];
then
    echo "You need to fill the parameter 'mysql.host' in 'config.json' with the parameter 'maria' in order to run this command."
    exit
fi

if [ "$DB_NAME" = "" ];
then
    echo "You need to fill the parameter 'mysql.database' in 'config.json' in order to run this command."
    exit
fi

if [ "$DB_USER" = "" ];
then
    echo "You need to fill the parameter 'mysql.user' in 'config.json' in order to run this command."
    exit
fi

if [ "$DB_PASSWD" = "" ];
then
    echo "You need to fill the parameter 'mysql.password' in 'config.json' in order to run this command."
    exit
fi

if [ "$HISTORY_PATH" = "" ] ;
then
    echo "You need to fill the parameter 'history_dir_path' in 'config.json' in order to run this command."
    exit
fi

if [ "$ASSETS_PATH" = "" ] ;
then
    echo "You need to fill the parameter 'assets_dir_path' in 'config.json' in order to run this command."
    exit
fi

if [ $PORT = null ];
then
    PORT=3020
fi


echo 'CREATE DATABASE IF NOT EXISTS '$DB_NAME';' > $SQL_SCRIPT_PATH

############## SCRIPT STARTS  ###########
echo 'version: "3"

services:
  db:
    image: mariadb:latest
    container_name: maria
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: '$DB_PASSWD'
    ports:
      - "3306:3306"
    volumes:
      - mariadata:/var/lib/mysql
      - ./init-script.sql:/docker-entrypoint-initdb.d/init-script.sql

  server:
    image: offchain:latest
    container_name: offchain
    ports:
      - "'$PORT':'$PORT'"
    restart: on-failure:10
    depends_on:
      "db":
        condition: service_started
    volumes:
      - ./src:/server/src
      - offchain_assets:'$ASSETS_PATH'
      - maria_migration_history:'$HISTORY_PATH'
      - ./config.json:/server/config.json

volumes:
  offchain_assets:
  maria_migration_history:
  mariadata:' > $DOCKERCOMPOSE_PATH

cd $DIR_NAME
docker-compose up -d
cd - >> /var/tmp/null