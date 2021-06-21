import express from 'express'
import proposal from '../../models/proposal'
import society, { SocietyModel } from '../../models/society'
import fetch from 'node-fetch'
import { ToPubKeyHash, GetAddressFromPubKeyHash } from 'wallet-util'
import { IContentLink } from '../interfaces'

import { ec as EC } from 'elliptic'
import alias from '../../models/alias'
const ec = new EC('secp256k1');


export const CheckContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { content } = req.body
    if ((content as string).split('~~~_~~~_~~~_~~~').length == 3){
        next()
        return
    }
    res.status(406)
    res.json({error: "Content must contains 3 parts"})
    return
}

export const CheckSignatureContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { signature, public_key, content } = req.body

    const err = () => {
        res.status(401)
        res.json({error: `Wrong signature on content.`})     
    }

    try {
        const res = ec.verify(Buffer.from(content), Buffer.from(signature as string, 'hex'), Buffer.from(public_key as string, 'hex'))
        res && next()
        !res && err()
    } catch (e){
        err()
    }
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
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
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

export const CheckIfAliasExist = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { author } = req.body

    const a = await alias.findByAddress(author)
    if (!a){
        res.status(404)
        res.json({error: "You need to create an alias on your address before adding content."})
        return
    }
    next()
}