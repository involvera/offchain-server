import express from 'express'
import { SocietyModel, thread } from '../../models'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const s = res.locals.society as SocietyModel
        const list = await thread.pullBySID(s.get().ID(), !page ? 0 : parseInt(page as string))
        res.status(200).json(await list.renderJSON('preview', s))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, pubkh } = req.params

    try {
        const s = res.locals.society as SocietyModel
        const t = await thread.fetchByPubKH(s.get().ID(), pubkh)
        t ? res.status(200).json(await t.renderJSON('view', s)) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}