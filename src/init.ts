import express from 'express'
import formData from 'express-form-data'
import morgan from 'morgan'
import { config } from 'elzeard'

export const initServer = async () => {
    const server = express()
    server.use(express.json() as any);
    server.use(formData.parse() as any)
    server.use(morgan('tiny') as any)

    server.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, signature, public_key, Access-Control-Allow-Origin");
      next();
    });

    config.setHistoryDirPath('./history')
    config.setMySQLConfig({
        host: '185.212.226.103',
        user: 'fanta',
        password: 'Aqw123!!',
        database: 'involvera'
    })
    await config.done()
    return server
}