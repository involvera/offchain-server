import express from 'express'
import {proposal, SocietyModel, embed, ProposalModel } from '../../models'
import { ToPubKeyHash, GetAddressFromPubKeyHash, VerifySignatureHex, ToArrayBufferFromB64 } from 'wallet-util'
import { ScriptEngine } from 'wallet-script'

export const CheckContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { content, content_link } = req.body

    const length = (content as string).split('~~~_~~~_~~~_~~~').length
    if (new ScriptEngine(ToArrayBufferFromB64(content_link.output.script)).proposalContentTypeString() == 'APPLICATION'){
        if (length == 4){
            next()
            return
        }
    } else {
        if (length == 3){
            next()
            return
        }
    }
    res.status(406)
    res.json({error: "Wrong length of content."})
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

export const GetAndAssignLinkToProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { public_key } = req.body
    
    try {
        const s = res.locals.society as SocietyModel
        const public_key_hashed = ToPubKeyHash(Buffer.from(public_key, 'hex')).toString('hex')
        const json = await ProposalModel.fetchOnChainData(s, public_key_hashed)
        if (!!json && typeof json !== 'string'){
            req.body = Object.assign(req.body, {
                author: GetAddressFromPubKeyHash(Buffer.from(json.pubkh_origin, 'hex')),
                vote: json.vote,
                content_link: json.link,
                public_key_hashed,
                index: json.index,
            })
            next()
        } else {
            res.status(404)
            res.json({error: json})
            return
        }
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}

export const BuildEmbed = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { content, sid, index } = req.body
    const e = await embed.fetchByIndex(parseInt(sid), parseInt(index))
    const s = res.locals.society as SocietyModel
    const p = new ProposalModel(req.body, {})
    await p.pullOnChainData(s)
    if (e){
        try {
            await e.setState({ content: p.get().preview().embed_code }).saveToDB()
        } catch(err){
            res.status(500)
            res.json(err.toString())
        }
    } else {
        try {
            await embed.create().proposal(p)
        } catch (err){
            res.status(500)
            res.json(err.toString())
        }
    }
    next()
}