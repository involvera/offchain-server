import express from 'express'
import proposal from '../models/proposal'
import society, { SocietyModel } from '../models/society'
import fetch from 'node-fetch'
import { bodyAssignator, ToPubKeyHash } from '../utils'

import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1');

interface IOutput {
    input_src_idxs: number[]
    value: string
    script: string[]
}

interface IKindLink {
    tx_id: string
    lh: number
    vout: number
    output: IOutput
    target_content: string
}

interface IVote {
    closed_at_lh: number
    approved: number
    declined: number
}

interface IContentLink {
    vote: IVote
    index: number
    link: IKindLink
    pubkh_origin: string
}


export const checkSignatureOnProposalContent = (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const { signature, public_key, content } = req.body
    
    if (!ec.verify(Buffer.from(content), Buffer.from(signature as string, 'hex'), Buffer.from(public_key as string, 'hex'))){
        res.status(401)
        res.json({error: `Wrong signature on content.`})
        return
    }
    next()
}

export const checkIfProposalAlreadyRecorded = async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
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

export const assignLinkToProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export const postProposal = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        proposal.quick().create(req.body)
        res.status(201)
        res.json(Object.assign({}, req.body, {
            content_link: JSON.parse(req.body.content_link),
            vote: JSON.parse(req.body.vote)
        }))
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}


export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()
    const { postHandler } = proposal.expressTools().request()

    server.post('/proposal', 
    bodyAssignator((req: express.Request) => {
        return {  content_link: '_', vote: '_', index: 0, author_public_key_hashed: '0000000000000000000000000000000000000000' }
    }),
    schemaValidator,
    checkSignatureOnProposalContent,
    checkIfProposalAlreadyRecorded,
    assignLinkToProposal,
    postProposal
    // postHandler(['name', 'path_name', 'currency_route_api', 'currency_symbol', 'description', 'domain'])
)
}