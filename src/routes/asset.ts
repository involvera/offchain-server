import express from 'express'
import { buildAllPP, createTemporaryFile, getPX500FolderPath, getPX64FolderPath } from '../utils/assets'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import { ServerConfiguration} from '../static/config'

export default (server: express.Express) => {

    const buildPPLimiter = rateLimit({
        windowMs: 60 * 60 * 1000 * 24,
        max: ServerConfiguration.production ? 10 : 9999999999, 
        message:
            'too many profil profile picture created on the last 24 hours, please try again after a day',
    })

    server.post('/asset/pp', buildPPLimiter, async (req: express.Request, res: express.Response) => {
        const { image } = req.body
        const tmpFP = await createTemporaryFile(image)
        if (!tmpFP){
            res.status(401).json("wrong base64 file")
            return
        }

        try {
            res.status(201).send(await buildAllPP(tmpFP))
        } catch (e){
            res.status(500).json({error: e.toString()})
        } finally {
            fs.rmSync(tmpFP)
        }
    })

    server.use('/asset/64', express.static(getPX64FolderPath()))
    server.use('/asset/500', express.static(getPX500FolderPath()))
}