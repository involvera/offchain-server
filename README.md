# Get started
Server for storing off-chain content from the social coin blockchain.

Git cloning

```
git clone https://github.com/involvera/content-hosting.git offchain-server
cd offchain-server
```

installing dependencies

```
yarn
```

set the configuration file
```
yarn setconfig
```

then fill the server configuration...

<br />


```json
{
    "production": false,                  //production or developement mode
    "port": 3020,
    "history_dir_path": "./history",      //folder where the history of all the automatic mysql migration will be stored (feature from the framwork used: Elzeard)
    "mysql": {                            //mysql classic configuration
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "your_society_db_name"
    },
    "ssl": { 
        "key": "",
        "cert": ""
    },
    "admin_key": "" //optional admin key for reseting requests during development (optional, and only used in development mode)
}

```
