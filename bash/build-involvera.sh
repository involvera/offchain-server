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

############## VARIABLES INIT ###########

SERVER_PORT=$(jq ".port" $JSON_CONFIG_PATH)
ADMIN_KEY=$(jq ".admin_key" $JSON_CONFIG_PATH | sed 's/\"//g') 
IS_PROD=$(jq ".production" $JSON_CONFIG_PATH | sed 's/\"//g') 

if [ $SERVER_PORT = null ];
then
    SERVER_PORT=3020
fi

if [ "$ADMIN_KEY" = "" ];
then
    echo "You need to fill the parameter 'admin_key' in 'config.json' in order to run this command."
    exit
fi

if [ "$IS_PROD" != "false" ]; 
then
    echo "You need to set the parameter 'production' to 'false' in 'config.json' in order to run this command."
    exit
fi

echo "Enter cryptocurrency server's domain: (Information: enter \`host.docker.internal\` if on local docker container)"
read DOMAIN

if [ "$DOMAIN" = "" ];
then
    echo "you need to enter a domain"
    exit
fi

echo "Enter cryptocurrency server's port:"
read PORT

if [ $PORT = "" ];
then
    echo "you need to enter a port"
    exit
fi

curl --location --request POST 'http://localhost:'$SERVER_PORT'/society' \
--header 'admin_key: '$ADMIN_KEY'' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Involvera",
    "path_name": "involvera",
    "currency_route_api": "http://'$DOMAIN':'$PORT'",
    "currency_symbol": "inv",
    "description": "Platform allowing open source projects to develop and manage their community without a central authority.",
    "domain": "involvera.com"
}'