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

JSON_CONFIG_PATH=$DIR_NAME"/config.json" 

SQL_HOST="localhost"
echo "Are you planning running the server on docker?"
read -p "Press Y or N to confirm:" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; 
then
    SQL_HOST="maria"
fi
echo ""

if [ ! -f $JSON_CONFIG_PATH ];
then
echo '{
    "production": false,
    "port": 3020,
    "history_dir_path": "'$DIR_NAME'/history",
    "assets_dir_path": "'$DIR_NAME'/data/assets",
    "mysql": {
        "host": "'$SQL_HOST'",
        "user": "root",
        "password": "YOUR_PASSWORD",
        "database": "involvera"
    },
    "ssl": {
        "key": "",
        "cert": ""
    },
    "admin_key": "2f72e55b962b6cd66ea70e8b6bd8657d1c87a23a65769213d76dcb5da6abf6b5"
}' > $JSON_CONFIG_PATH
echo "config.json created."

else
echo "config.json already exist"
fi
