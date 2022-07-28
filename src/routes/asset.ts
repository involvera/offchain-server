import express from 'express'
import { buildAllPP, getPX500FolderPath, getPX64FolderPath } from '../utils/assets'
import rateLimit from 'express-rate-limit'

export default (server: express.Express) => {

    const buildPPLimiter = rateLimit({
        windowMs: 60 * 60 * 1000 * 24,
        max: 3, 
        message:
            'Too many profil profile picture created on the last 24 hours, please try again after a day',
    })

    server.post('/asset/pp', buildPPLimiter, async (req: express.Request, res: express.Response) => {
        try {
            res.status(201)
            res.send(await buildAllPP((req.files?.image as any).path))
        } catch (e: any){
            res.status(500)
            res.json({error: e.toString()})
        }
    })

    server.use('/asset/64', express.static(getPX64FolderPath()))
    server.use('/asset/500', express.static(getPX500FolderPath()))
}