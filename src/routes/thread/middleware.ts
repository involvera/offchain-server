import express from 'express'
import axios from 'axios'
import { ToPubKeyHash, GetAddressFromPubKeyHash } from 'wallet-util'
import { thread, SocietyModel, embed, ThreadModel } from '../../models'
import { IContentLink } from 'community-coin-types'

export const GetAndAssignLinkToThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { public_key } = req.body
    
    try {
        const s = res.locals.society as SocietyModel
        const public_key_hashed = ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')
        const response = await axios(s.get().currencyRouteAPI() + `/thread/${public_key_hashed}`, {
            validateStatus: function (status) {
                return status >= 200 && status <= 500
            }
        })
        if (response.status == 200){
            const json = response.data as IContentLink
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
                public_key_hashed,
                lugh_height: json.link.lh,
                content_link: JSON.stringify(json.link),
            })
            next()
        } else {
            const {data, status} = response
            res.status(status).json({error: data})
            return
        }
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const CheckIfThreadAlreadyRecorded = async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { public_key } = req.body
    const s = res.locals.society as SocietyModel

    const p = await thread.fetchByPubKH(s.get().ID(), ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex'))
    if (p == null){
        next()
        return
    }
    res.status(401).json({error: `Thread is already recorded.`})
    return
}

export const BuildEmbed = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { public_key, sid } = req.body
    const e = await embed.fetchByPKH(parseInt(sid), ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex'), 'THREAD')
    const t = new ThreadModel(req.body, {}).setState({ author: res.locals.alias }, true)

    if (e){
        try {
            const target = await t.get().target()
            await e.setState({ content: t.get().preview(target).zipped().embed_code }).saveToDB()
        } catch(err){
            res.status(500).json(err.toString())
        }
    } else {
        try {
            await embed.create().thread(t)
        } catch (err){
            res.status(500).json(err.toString())
        }
    }
    next()
}

export const CheckContentOrTitlePresence = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { title, content } = req.body
    if (!title){
        if (content.length < 20){
            res.status(406).json(`Thread's content must contain 20 characters minimum.`)
            return
        }
    } else if (!content){
        if (title.length < 20){
            res.status(406).json(`Thread's title must contain 20 characters minimum.`)
            return
        }
    }
    next()
}