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


echo "docker commands:\n"
sh $DIR_NAME/bash/print.sh
echo "\n"
echo "other commands:\n"
echo "build-involvera-society   : create the involvera society (usable when the server + database have been freshly initiated with empty DB)"
echo "\n"
