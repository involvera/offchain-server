import express from 'express'
import fetch from 'node-fetch'
import { ToPubKeyHash, GetAddressFromPubKeyHash } from 'wallet-util'
import { thread, SocietyModel } from '../../models'
import { IContentLink } from '../interfaces'

export const GetAndAssignLinkToThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { public_key } = req.body
    
    try {
        const s = res.locals.society as SocietyModel
        const public_key_hashed = ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')
        const r = await fetch(s.get().currencyRouteAPI() + `/thread/${public_key_hashed}`)
        if (r.status == 200){
            const json = await r.json() as IContentLink
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
                public_key_hashed,
                content_link: JSON.stringify(json.link),
            })
            next()
        } else {
            const text = await r.text()
            res.status(r.status)
            res.json({error: text})
            return
        }
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}

export const CheckIfThreadAlreadyRecorded = async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { public_key } = req.body
    
    const p = await thread.fetchByPubK(public_key)
    if (p == null){
        next()
        return
    }
    res.status(401)
    res.json({error: `Thread is already recorded.`})
    return
}