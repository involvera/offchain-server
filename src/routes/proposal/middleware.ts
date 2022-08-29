import express from 'express'
import {proposal, SocietyModel, embed, ProposalModel } from '../../models'
import { Script } from 'wallet-script'
import { fetchAndPickRightProposalContext } from './lib'
import { Inv } from 'wallet-util'

export const CheckContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { content, content_link } = req.body

    const length = (content as string).split('~~~_~~~_~~~_~~~').length
    if (Script.fromBase64(content_link.output.script).typeD2() === 'APPLICATION'){
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
    res.status(406).json({error: "Wrong length of content."})
    return
}

export const CheckSignatureContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { signature, public_key, content } = req.body
    const sig = new Inv.Signature({signature, public_key})

    if (sig.verify(content)){
        next()
    } else {
        res.status(401).json({error: `Wrong signature on content.`})         
    }
}

export const CheckIfProposalAlreadyRecorded = async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const pubKey = Inv.PubKey.fromHex(req.body.public_key)
    const s = res.locals.society as SocietyModel

    const p = await proposal.fetchByPubKH(s.get().ID(), pubKey.hash())
    if (p == null){
        next()
        return
    }
    res.status(401).json({error: `Proposal is already recorded.`})
    return
}

export const GetAndAssignLinkToProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pubKey = Inv.PubKey.fromHex(req.body.public_key)
    
    try {
        const s = res.locals.society as SocietyModel
        const json = await ProposalModel.fetchOnChainData(s, pubKey.hash())
        if (!!json && typeof json !== 'string'){
            const context = await fetchAndPickRightProposalContext(s, pubKey.hash(), Script.fromBase64(json.link.output.script))
            req.body = Object.assign(req.body, {
                author: Inv.PubKH.fromHex(json.pubkh_origin).toAddress().get(),
                vote: json.vote,
                content_link: json.link,
                public_key_hashed: pubKey.hash().hex(),
                index: json.index,
                context
            })
            next()
        } else {
            res.status(404).json({error: json})
        }
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const BuildEmbed = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, index } = req.body
    const e = await embed.fetchByIndex(parseInt(sid), parseInt(index))
    const s = res.locals.society as SocietyModel
    const p = new ProposalModel(Object.assign({}, req.body, {
        author: res.locals.alias
    }), {})

    try {
        await p.pullOnChainData(s)
    } catch (e){
        res.status(500).json(e.toString())
        return        
    }
    
    if (e){
        try {
            await e.setState({ content: p.get().preview().zipped().embed_code }).saveToDB()
        } catch(err){
            res.status(500).json(err.toString())
            return
        }
    } else {
        try {
            await embed.create().proposal(p)
        } catch (err){
            res.status(500).json(err.toString())
            return
        }
    }
    next()
}