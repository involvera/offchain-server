import https from 'https'
import fs from 'fs'
import { initServer } from './init'
import { initRoutes } from './routes'
import { ServerConfiguration} from './static/config'

initServer().then((server) => {
    initRoutes(server)

    const { port, ssl, production } = ServerConfiguration

    //dev
    if (!production){
        server.listen(port, () => {
            console.log(`[DEVELOPEMENT MODE] Ready on http://localhost:${port}`)
        })
    //prod
    } else {
        const options = ssl && ssl.key && ssl.cert ? {
            key: fs.readFileSync(ssl.key),
            cert: fs.readFileSync(ssl.cert)
        }: {}
        https.createServer(options, server).listen(port, () => {
            console.log(`[PRODUCTION MODE] Ready on http://localhost:${port}`)
        })
    }
})