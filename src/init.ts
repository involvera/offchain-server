import express from 'express'
// import formData from 'express-form-data'
import formidable from 'express-formidable';

import morgan from 'morgan'
import { config } from 'elzeard'
import { cachedSocieties } from './models'
import cors from 'cors'
import { loadServerConfiguration, ServerConfiguration} from './static/config'


export const initCachedData = async () => {
  await cachedSocieties.pullAll(); 
}

export const initServer = async () => {
    await loadServerConfiguration()

    const server = express()
    server.use(express.json() as any);
    server.use(formidable());
    server.use(morgan('tiny') as any)

    server.use(function(req, res, next) {
      res.header("Access-Control-Allow-Headers", "Access-Control-Max-Age, Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type,Accept, signature, public_key, admin_key, page, filter, sid, target_pkh, group");
      res.header("Access-Control-Allow-Origin", "*"); 
      res.header("Access-Control-Max-Age", "7200")
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
      next();
    });

    server.use(cors())

    config.setHistoryDirPath(ServerConfiguration.history_dir_path)
    config.setMySQLConfig(Object.assign({timezone: 'utc'}, ServerConfiguration.mysql))

    await config.done()
    try {
      await initCachedData()
    } catch (e){
      console.log(e)
      process.exit(0)
    }
    return server
}