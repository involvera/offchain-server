import express from 'express'
import {society, proposal, alias, SocietyModel } from '../../models'
import fetch from 'node-fetch'
import { ToPubKeyHash, GetAddressFromPubKeyHash, VerifySignatureHex } from 'wallet-util'
import { IContentLink } from '../interfaces'

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

    if (VerifySignatureHex({signature_hex: signature as string, public_key_hex: public_key as string}, Buffer.from(content))){
        next()
    } else {
        res.status(401)
        res.json({error: `Wrong signature on content.`})         
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
        const public_key_hashed = ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')
        const r = await fetch(s.get().currencyRouteAPI() + `/proposal/${public_key_hashed}`)
        if (r.status == 200){
            const json = await r.json() as IContentLink
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
                vote: JSON.stringify(json.vote),
                content_link: JSON.stringify(json.link),
                public_key_hashed, 
                index: json.index
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