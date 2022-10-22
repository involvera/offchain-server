# Get started
Server for storing off-chain content from the social coin blockchain.

Git cloning

```
git clone https://github.com/involvera/content-hosting.git offchain-server
cd offchain-server
```

run the initialization script

```
cd offchain-server/
yarn setconfig
```

then fill the configuration file **config.json**. [See below](#configuration)

<br />


## First step
When the config file is filled you can use:

### Docker

Build the image:

```
yarn dockerfile
```

Then start running your container

```
yarn docker-compose
```

### Your machine

By just making sure node and all dependencies are installed.

Then install package dependencies:
```
yarn
```

And start the server...
```
yarn dev
```


## Last step

When the server is on either on docker or your machine, you need to **create the first society** and make sure **the server of the society's cryptocurrency is on**. 

If not done yet, no panic [you can do it here](https://github.com/involvera/community-coin).

When everything is setup run:
```
yarn build-involvera-society
```

you can check everything is working fine by requesting:
```
http://localhost:YOUR_PORT/society/1
```

Now you are all setup and you can start running [the client](https://github.com/involvera/app)

<br />
<br />

# Configuration

| Parameter | Type | Required | Description | Comment 
| --- | --- | --- | --- | --- |
| history_dir_path | string | yes | Absolute path of the folder where the migration history is stored. |
| assets_dir_path | string | yes | Absolute path of the folder where the user assets are stored. |
| production | boolean | yes | `true` if used in production mode 
| port | int | Default: 3020 | Port used by the server
| mysql | Object | yes | mysql/mariadb configuration | See below for more about the parameters
| admin_key | string | no | Key used on some requests in dev mode |

<br />

Example:
```json
{
    "production": false,                
    "port": 3020,
    "history_dir_path": "/Users/jordan/involvera/offchain-server/history",
    "assets_dir_path": "/Users/jordan/involvera/offchain-server/assets",
    "mysql": {                           
        "host": "'localhost' or container_name if on docker",
        "user": "root",
        "password": "password",
        "database": "your_society_db_name"
    },
    "ssl": { 
        "key": "",
        "cert": ""
    },
    "admin_key": ""
}

```
