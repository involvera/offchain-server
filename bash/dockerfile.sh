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
DOCKERFILE_PATH=$DIR_NAME"/Dockerfile" 

############## VARIABLES INIT ###########

DB_NAME=$(jq ".mysql.database" $JSON_CONFIG_PATH | sed 's/\"//g')
PORT=$(jq ".port" $JSON_CONFIG_PATH)
HISTORY_PATH=$(jq ".history_dir_path" $JSON_CONFIG_PATH | sed 's/\"//g')
ASSETS_PATH=$(jq ".assets_dir_path" $JSON_CONFIG_PATH | sed 's/\"//g')
IS_PROD=$(jq ".production" $JSON_CONFIG_PATH | sed 's/\"//g') 

if [ "$DB_NAME" = "" ];
then
    echo "You need to fill the parameter 'mysql.database' in 'config.json' in order to run this command."
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

if [ "$IS_PROD" = "" ]; 
then
    echo "You need to fill the parameter 'production' in 'config.json' in order to run this command."
    exit
fi

CMD_PARAM="dev"
if [ "$IS_PROD" = "true" ];
then
    CMD_PARAM="start"
fi

############## SCRIPT STARTS  ###########
echo 'FROM node:16-alpine
WORKDIR /server

COPY package.json ./
RUN yarn && yarn cache clean --force

COPY config.json ./
COPY tsconfig.json ./
COPY src ./src

EXPOSE '$PORT'

CMD ["yarn", "'$CMD_PARAM'"]
' > $DOCKERFILE_PATH

echo "Dockerfile created with exposed port: $PORT."
echo "You have 5 seconds to break the program and change the parameter 'port' in 'config.json' before building the image."
i=5;
while [ $i -gt 0 ]
do
sleep 1
((i--))
echo $i
done

$(docker build -t offchain $DIR_NAME)
