import express from 'express'
import { buildAllPP, getPX500FolderPath, getPX64FolderPath } from '../utils/assets'

export default (server: express.Express) => {

    server.post('/asset', async (req: express.Request, res: express.Response) => {
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