import express from 'express'
import fetch from 'node-fetch'
import { ToPubKeyHash, GetAddressFromPubKeyHash } from 'wallet-util'
import { thread, society, SocietyModel } from '../../models'
import { IContentLink } from '../interfaces'

export const CheckSIDAndAssignLinkToThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, public_key } = req.body
    
    const s = await society.fetchByID(sid) as SocietyModel
    if (!s){
        res.status(404)
        return
    }
    try {
        const r = await fetch(s.get().currencyRouteAPI() + `/thread/${ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')}`)
        if (r.status == 200){
            const json = await r.json() as IContentLink
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
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