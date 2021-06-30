import express from 'express'
import { reaction, SocietyModel } from '../models'
import fetch from 'node-fetch'
import { CheckIfSocietyExists } from './society'
import { IReactionLink } from './interfaces'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64, GetAddressFromPubKeyHash } from 'wallet-util'

export const GetAndAssignReactionLink = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { tx_id, vout } = req.body

    const s = res.locals.society as SocietyModel
    try {
        const r = await fetch(s.get().currencyRouteAPI() + `/reaction/${tx_id}/${vout}`)
        if (r.status == 200){
            const json = await r.json() as IReactionLink
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
                category: json.category,
                target_pkh: new ScriptEngine(ToArrayBufferFromB64(json.output.script)).parse().targetPKHFromContentScript().toString('hex')
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

export const CheckIfReactionAlreadyExists = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const s = res.locals.society as SocietyModel
    const { tx_id, vout } = req.body

    const r = await reaction.fetchByTxIDAndVout(s.get().ID(), tx_id, vout)
    if (r){
        res.status(406)
        res.json({error: "Reaction already recorded"})
        return
    }
    next()
}


export default (server: express.Express) => {
    const { schemaValidator } = reaction.expressTools().middleware()
    const { postHandler } = reaction.expressTools().request()

    server.post('/reaction',
        CheckIfSocietyExists,
        CheckIfReactionAlreadyExists,
        GetAndAssignReactionLink,
        schemaValidator,
        postHandler(['sid', 'author', 'category', 'tx_id', 'vout', 'target_pkh'])
    )
}