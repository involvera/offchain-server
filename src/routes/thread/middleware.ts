import express from 'express'
import axios from 'axios'
import { thread, SocietyModel, embed, ThreadModel } from '../../models'
import { ONCHAIN } from 'community-coin-types'
import { Inv } from 'wallet-util'

export const GetAndAssignLinkToThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pubKey = Inv.PubKey.fromHex(req.body.public_key)
    
    try {
        const s = res.locals.society as SocietyModel
        const public_key_hashed = pubKey.hash().hex()
        const response = await axios(s.get().currencyRouteAPI() + `/thread/${public_key_hashed}`, {
            validateStatus: function (status) {
                return status >= 200 && status <= 500
            }
        })
        if (response.status == 200){
            const json = response.data as ONCHAIN.IContentLink
            req.body = Object.assign(req.body, {
                author: Inv.PubKH.fromHex(json.pubkh_origin).toAddress().get(),
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
    const pubKey = Inv.PubKey.fromHex(req.body.public_key)
    const s = res.locals.society as SocietyModel

    const p = await thread.fetchByPubKH(s.get().ID(), pubKey.hash())
    if (p == null){
        next()
        return
    }
    res.status(401).json({error: `thread is already recorded`})
    return
}

export const BuildEmbed = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid } = req.body
    const pubKey = Inv.PubKey.fromHex(req.body.public_key)
    const e = await embed.fetchByPKH(parseInt(sid), pubKey.hash(), 'THREAD')
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
            res.status(406).json(`thread's content must contain 20 characters minimum`)
            return
        }
    } else if (!content){
        if (title.length < 20){
            res.status(406).json(`thread's title must contain 20 characters minimum`)
            return
        }
    }
    next()
}