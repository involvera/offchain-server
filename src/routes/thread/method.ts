import express from 'express'
import { SocietyModel, thread, ThreadModel } from '../../models'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const s = res.locals.society as SocietyModel
        const list = await thread.pullBySID(s.get().ID(), !page ? 0 : parseInt(page as string))
        res.status(200).json(await list.renderPreviewList(s))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { pubkh } = req.params

    try {
        const s = res.locals.society as SocietyModel
        const t = await thread.fetchByPubKH(s.get().ID(), pubkh)
        t ? res.status(200).json(await t.renderView(s)) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const PostThread = async  (req: express.Request, res: express.Response, next: express.NextFunction) => {

    const { foreignConstraint } = thread.expressTools().checks()
    const data: any = {}
    const keys = ['content', 'title', 'public_key', 'signature', 'content_link', 'author', 'public_key_hashed', 'sid', 'lugh_height']

    keys.map((v: string) => {
        const val = req.body[v]
        if (val === null || val === NaN || val === undefined)
            data[v] = null
        else 
            data[v] = val
    })

    const errForeign = await foreignConstraint(data)
    if (errForeign){
        res.status(409)
        res.json(errForeign)
        return
    }

    try {
        const s = res.locals.society as SocietyModel
        const m = await thread.quick().create(data) as ThreadModel
        res.status(201).json(await m.renderView(s))
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}