import { IKindLinkUnRaw } from 'community-coin-types'
import express from 'express'
import { SocietyModel, thread, ThreadCollection, ThreadModel } from '../../models'
import { getHeaderSignature } from '../../utils'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page, target_pkh } = req.headers

    const isTargeting = typeof target_pkh == 'string' && target_pkh.length
    try {
        const s = res.locals.society as SocietyModel
        let list: ThreadCollection;
        if (isTargeting)
            list = await thread.pullBySIDAndTargetPKH(s.get().ID(), target_pkh as string, !page ? 0 : parseInt(page as string), 10)
        else
            list = await thread.pullBySID(s.get().ID(), !page ? 0 : parseInt(page as string), 10)
        res.status(200).json(await list.renderPreviewList(s, getHeaderSignature(req)))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetThreadRepliesList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { pubkh, page } = req.params

    try {
        const s = res.locals.society as SocietyModel
        const list = await thread.pullBySIDAndTargetPKHSortedAsc(s.get().ID(), pubkh, !page ? 0 : parseInt(page as string), 5)
        const json = await list.renderThreadRepliesJSON(s, getHeaderSignature(req))
        res.status(200).json(json)
    } catch (e){
        res.status(500).json(e.toString())
    }

}

export const GetThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { pubkh } = req.params
    const { target_pkh } = req.headers

    try {
        const s = res.locals.society as SocietyModel
        if (!target_pkh){
            const t = await thread.fetchByPubKH(s.get().ID(), pubkh)
            t ? res.status(200).json(await t.renderViewJSON(s, getHeaderSignature(req))) : res.sendStatus(404)
        } else {
            const ret = await Promise.all([
                thread.fetchByPubKH(s.get().ID(), pubkh),
                thread.fetchByPubKH(s.get().ID(), target_pkh as string)
            ])
            const td = ret[0]
            const tgt = ret[1]
            if (!td || !tgt){
                res.sendStatus(404)
                return
            }

            if (td.get().targetPKH() != tgt.get().pubKH()){
                res.status(400).json("pkh and target_pkh not correlated")
                return
            }

            res.status(200).json(await Promise.all([
                await tgt.renderViewJSON(s, getHeaderSignature(req)),
                await td.renderReplyJSON(s, getHeaderSignature(req))
            ]))
        }
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
        res.status(409)
        res.json(errForeign)
        return
    }

    try {
        const s = res.locals.society as SocietyModel
        data.target_pkh = (JSON.parse(data.content_link) as IKindLinkUnRaw).target_content || null
        const m = await thread.quick().create(data) as ThreadModel
        res.status(201).json(await m.renderViewJSON(s))
    } catch (e){
        console.log(e)
        res.status(500)
        res.json(e.toString())
    }
}