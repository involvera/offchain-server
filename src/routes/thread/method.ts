import express from 'express'
import thread, { ThreadModel } from '../../models/thread'

export const PostThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const p = await thread.quick().create(req.body) as ThreadModel
        p.prepareJSONRendering()
        res.status(201)
        res.json(p.to().plain())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}