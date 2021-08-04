import express from 'express'
import formData from 'express-form-data'
import morgan from 'morgan'
import { config } from 'elzeard'
import { cachedSocieties } from './models'

export const initCachedData = async () => {
  await cachedSocieties.pullAll();
  await cachedSocieties.fetchMembersFromAll();
}

export const initServer = async () => {
    const server = express()
    server.use(express.json() as any);
    server.use(formData.parse() as any)
    server.use(morgan('tiny') as any)

    server.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, signature, public_key, admin_key, Access-Control-Allow-Origin, page, filter, sid");
      next();
    });

    config.setHistoryDirPath('./history')
    config.setMySQLConfig({
        host: '185.212.226.103',
        user: 'fanta',
        password: 'Aqw123!!',
        database: 'involvera'
    })
    config.setCriticalCode('082376')


    await config.done()
    try {
      await initCachedData()
    } catch (e){
      console.log(e)
      process.exit(0)
    }
    return server
}