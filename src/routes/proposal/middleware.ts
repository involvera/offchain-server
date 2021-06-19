import express from 'express'
import proposal from '../../models/proposal'
import society, { SocietyModel } from '../../models/society'
import fetch from 'node-fetch'
import { ToPubKeyHash } from 'wallet-util'
import { IContentLink } from './interfaces'

import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1');

export const CheckSignatureOnProposalContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { signature, public_key, content } = req.body
    
    if (!ec.verify(Buffer.from(content), Buffer.from(signature as string, 'hex'), Buffer.from(public_key as string, 'hex'))){
        res.status(401)
        res.json({error: `Wrong signature on content.`})
        return
    }
    next()
}

export const CheckIfProposalAlreadyRecorded = async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { public_key } = req.body
    
    const p = await proposal.fetchByPubK(public_key)
    if (p == null){
        next()
        return
    }
    res.status(401)
    res.json({error: `Proposal is already recorded.`})
    return
}

export const CheckSIDAndAssignLinkToProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, public_key } = req.body
    
    const s = await society.fetchByID(sid) as SocietyModel
    if (!s){
        res.status(404)
        return
    }
    try {
        const r = await fetch(s.get().currencyRouteAPI() + `/proposal/${ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')}`)
        if (r.status == 200){
            const json = await r.json() as IContentLink
            req.body = Object.assign(req.body, {
                author_public_key_hashed: json.pubkh_origin,
                vote: JSON.stringify(json.vote),
                content_link: JSON.stringify(json.link),
                index: json.index
            })
            next()
        } else {
            res.status(r.status)
            res.json(await r.json())
            return
        }
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}