import fs from 'fs'
import { Lib, Inv } from 'wallet-util'
import { IServerConfigJSON } from './interfaces'
import { randomBytes } from 'crypto'

let ServerConfiguration: IServerConfigJSON

const loadServerConfiguration = async () => {
    let content: any = null
    try {
        content = await fs.readFileSync('./config.json', 'utf-8')
    } catch (e){
        console.log('run `yarn setconfig` to generate a configuration file')
        process.exit(0)
    }

    ServerConfiguration = JSON.parse(content) 
    if (!ServerConfiguration.history_dir_path){
        console.log('set a valid `history_dir_path` in the config.json file')
        process.exit(0)
    }

    if (!ServerConfiguration.port || ServerConfiguration.port < 0 || ServerConfiguration.port > 65_535){
        ServerConfiguration.port = 3020
    }

    if (!ServerConfiguration.mysql){
        console.log('no `mysql` configuration set in config.json')
        process.exit(0)
    }

    if (!ServerConfiguration.assets_dir_path){
        console.log('no `assets_dir_path` configuration set in config.json')
        process.exit(0)
    }

    if (!ServerConfiguration.mysql.database){
        console.log('no `database` field set in the mysql object in config.json')
        process.exit(0)
    }

    if (!ServerConfiguration.mysql.user){
        console.log('no `username` field set in the mysql object in config.json')
        process.exit(0)
    }

    if (!ServerConfiguration.mysql.host){
        ServerConfiguration.mysql.host = 'localhost'
        console.log('mysql host is `localhost`')
    }

    if (!ServerConfiguration.admin_key) {
        ServerConfiguration.admin_key = new Inv.InvBuffer(Lib.Hash.Sha256(randomBytes(32))).hex()
        !ServerConfiguration.production && console.log(`No admin_key found in config.json.\nFor this session the admin key is: "${ServerConfiguration.admin_key}"\n`)
    }
}

export {
    ServerConfiguration,
    loadServerConfiguration
}