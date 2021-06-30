import express from 'express'
import { thread } from '../../models'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await thread.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200)
        res.json(list.renderJSON())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}