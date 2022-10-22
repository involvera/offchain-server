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

BASE=$(basename $DIR_NAME)

docker volume rm $BASE"_offchain_assets"
docker volume rm $BASE"_maria_migration_history"
docker volume rm $BASE"_mariadata"