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

IS_PROD=$(jq ".production" $JSON_CONFIG_PATH | sed 's/\"//g') 

if [ "$IS_PROD" != "false" ]; 
then
    echo "You need to set the parameter 'production' to 'false' in 'config.json' in order to run this command."
    exit
fi

cd $DIR_NAME
docker-compose down --volumes
cd - >> /var/tmp/null
