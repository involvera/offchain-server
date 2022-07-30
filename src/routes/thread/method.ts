import { IKindLinkUnRaw } from 'community-coin-types'
import express from 'express'
import { AliasModel, SocietyModel, thread, ThreadCollection, ThreadModel } from '../../models'
import { getHeaderSignature } from '../../utils'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { offset, target_pkh } = req.headers

    const isTargeting = typeof target_pkh == 'string' && target_pkh.length
    try {
        const s = res.locals.society as SocietyModel
        let list: ThreadCollection;
        if (isTargeting)
            list = await thread.pullLastsBySIDAndTargetPKH(s.get().ID(), target_pkh as string, !offset ? 0 : parseInt(offset as string), 10)
        else {
            list = await thread.pullLastsBySID(s.get().ID(), !offset ? 0 : parseInt(offset as string), 10)
        }
        res.status(200).json(await list.renderPreviewList(s, getHeaderSignature(req)))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetUserThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { offset } = req.headers
    const a = res.locals.alias as AliasModel
    const s = res.locals.society as SocietyModel

    try {
        const list = await thread.pullLastsByAuthorAddress(a.get().address(), s.get().ID(), !offset ? 0 : parseInt(offset as string), 10)
        res.status(200).json(await list.renderPreviewList(s, getHeaderSignature(req)))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetThreadRepliesList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { pubkh, offset } = req.params

    try {
        const s = res.locals.society as SocietyModel
        const list = await thread.pullBySIDAndTargetPKHSortedAsc(s.get().ID(), pubkh, !offset ? 0 : parseInt(offset as string), 5)
        const json = await list.renderThreadRepliesJSON(s, getHeaderSignature(req))
        res.status(200).json(json)
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetFullThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { pubkh } = req.params

    try {
        const s = res.locals.society as SocietyModel
        const th = await thread.fetchByPubKH(s.get().ID(), pubkh)
        if (th && th.get().targetPKH()){
            const tgt = await thread.fetchByPubKH(s.get().ID(), th.get().targetPKH())
            if (tgt){
                res.status(200).json(await Promise.all([
                    th.renderReplyJSON(s, getHeaderSignature(req)),
                    tgt.renderViewJSON(s, getHeaderSignature(req))
                ]))
                return
            }
        }
        if (th){
            res.status(200).json([await th.renderViewJSON(s, getHeaderSignature(req))])
            return
        }
        res.sendStatus(404)
        return
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const PostThread = async  (req: express.Request, res: express.Response, next: express.NextFunction) => {

    const { foreignConstraint } = thread.expressTools().checks()
    const data: any = {}
    const keys = ['content', 'title', 'public_key', 'signature', 'content_link', 'author', 'public_key_hashed', 'sid', 'lugh_height', 'target_pkh']

    keys.map((v: string) => {
        const val = req.body[v]
        if (val === null || val === NaN || val === undefined)
            data[v] = null
        else 
            data[v] = val
    })

    const errForeign = await foreignConstraint(data)
    if (errForeign){
        res.status(409).json(errForeign)
        return
    }

    try {
        const s = res.locals.society as SocietyModel
        data.target_pkh = (JSON.parse(data.content_link) as IKindLinkUnRaw).target_content || null
        const m = await thread.quick().create(data) as ThreadModel
        res.status(201).json(await m.renderViewJSON(s))
    } catch (e){
        res.status(500).json(e.toString())
    }
}