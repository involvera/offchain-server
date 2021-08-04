import https from 'https'
import fs from 'fs'
import { initServer } from './init'
import { initRoutes } from './routes'
import { IS_PRODUCTION } from './static'

const PORT = 3020

initServer().then(async (server) => {
    initRoutes(server)

    //dev
    if (!IS_PRODUCTION){
        server.listen(PORT, () => {
            console.log(`[DEVELOPEMENT MODE] Ready on http://localhost:${PORT}`)
        })
    //prod
    } else {
        const options = {
            key: fs.readFileSync("/etc/letsencrypt/live/involvera.com/privkey.pem"),
            cert: fs.readFileSync("/etc/letsencrypt/live/involvera.com/fullchain.pem")
        };
        https.createServer(options, server).listen(PORT, () => {
            console.log(`[PRODUCTION MODE] Ready on http://localhost:${PORT}`)
        })
    }
})