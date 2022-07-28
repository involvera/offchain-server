#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
DIR_NAME=$(dirname $SCRIPT_DIR);

JSON_CONFIG_PATH=$DIR_NAME"/config.json" 

if [ ! -f $JSON_CONFIG_PATH ];
then
echo '{
    "production": false,
    "port": 3020,
    "history_dir_path": "",
    "assets_dir_path": "",
    "mysql": {
        "host": "localhost",
        "user": "",
        "password": "",
        "database": ""
    },
    "ssl": {
        "key": "",
        "cert": ""
    },
    "admin_key": ""
}' > $JSON_CONFIG_PATH
echo "config.json created."
else
echo "config.json already exist"
fi
