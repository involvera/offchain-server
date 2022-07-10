import express from 'express'
import formData from 'express-form-data'
import morgan from 'morgan'
import { config } from 'elzeard'
import { cachedSocieties } from './models'
import cors from 'cors'

export const initCachedData = async () => {
  await cachedSocieties.pullAll(); 
}

export const initServer = async () => {
    const server = express()
    server.use(express.json() as any);
    server.use(formData.parse() as any)
    server.use(morgan('tiny') as any)

    server.use(function(req, res, next) {
      res.header("Access-Control-Allow-Headers", "Access-Control-Max-Age, Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type,Accept, signature, public_key, admin_key, page, filter, sid, target_pkh, group");
      res.header("Access-Control-Allow-Origin", "*"); 
      res.header("Access-Control-Max-Age", "7200")
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
      next();
    });

    server.use(cors())

    config.setHistoryDirPath('./history')
    config.setMySQLConfig({
        host: 'localhost',
        user: 'fanta',
        password: 'aqw12345',
        database: 'involvera',
        timezone: 'utc'
    })

    await config.done()
    try {
      await initCachedData()
    } catch (e){
      console.log(e)
      process.exit(0)
    }
    return server
}