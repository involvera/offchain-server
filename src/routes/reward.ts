import express from 'express'
import { reward, SocietyModel } from '../models'
import fetch from 'node-fetch'
import { CheckIfSocietyExists } from './society'
import { IRewardLink } from './interfaces'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64, GetAddressFromPubKeyHash } from 'wallet-util'

export const GetAndAssignRewardLink = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { tx_id, vout } = req.body

    const s = res.locals.society as SocietyModel
    try {
        const r = await fetch(s.get().currencyRouteAPI() + `/reward/${tx_id}/${vout}`)
        if (r.status == 200){
            const json = await r.json() as IRewardLink
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
    } catch (e) {
        res.status(500)
        res.json(e.toString())
    }
}

export const CheckIfRewardAlreadyExists = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const s = res.locals.society as SocietyModel
    const { tx_id, vout } = req.body

    const r = await reward.fetchByTxIDAndVout(s.get().ID(), tx_id, vout)
    if (r){
        res.status(406)
        res.json({error: "Reward already recorded"})
        return
    }
    next()
}

export default (server: express.Express) => {
    const { schemaValidator } = reward.expressTools().middleware()
    const { postHandler } = reward.expressTools().request()

    server.post('/reward',
        CheckIfSocietyExists,
        CheckIfRewardAlreadyExists,
        GetAndAssignRewardLink,
        schemaValidator,
        (req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.log(req.body)
            next()
        },
        postHandler(['sid', 'author', 'category', 'tx_id', 'vout', 'target_pkh'])
    )
}