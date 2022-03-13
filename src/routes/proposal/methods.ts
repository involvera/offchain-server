import express from 'express'
import { proposal, ProposalCollection, ProposalModel, SocietyModel } from '../../models'
import { getHeaderSignature } from './lib'

export const GetProposalList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { offset } = req.headers

    try {
        console.log(offset)
        const list = await proposal.pullBySID(parseInt(req.params.sid), parseInt(offset as string))
        const l = list.local().orderBy('index', 'desc') as ProposalCollection
        const s = res.locals.society as SocietyModel
        res.status(200).json(await l.renderJSON('preview', s, getHeaderSignature(req)))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, index } = req.params

    try {
        const p = await proposal.fetchByIndex(parseInt(sid), parseInt(index))
        const s = res.locals.society as SocietyModel
        p ? res.status(200).json(await p.renderJSON('view', s, getHeaderSignature(req))) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetLastProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const p = await proposal.fetchLast()
        const s = res.locals.society as SocietyModel
        p ? res.status(200).json(await p.renderJSON('view', s, getHeaderSignature(req))) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const PostProposal = async  (req: express.Request, res: express.Response, next: express.NextFunction) => {

    const { foreignConstraint } = proposal.expressTools().checks()
    const data: any = {}
    const keys = ['content', 'title', 'public_key', 'signature', 'index', 'author', 'public_key_hashed', 'sid', 'context']
    
    keys.map((v: string) => {
        const val = req.body[v]
        if (val === null || val === NaN || val === undefined)
            data[v] = null
        else 
            data[v] = val
    })

    const errForeign = await foreignConstraint(data)
    if (errForeign){
        res.status(409)
        res.json(errForeign)
        return
    }

    try {
        const m = await proposal.quick().create(data) as ProposalModel
        m.setOnChainData({
            vote: req.body.vote,
            link: req.body.content_link,
            pubkh_origin: req.body.public_key_hashed,
            index: req.body.index,
            rewards: null,
            user_vote: req.body.user_vote
        })
        const j = await m.renderJSON('full', null)
        res.status(201).json(j)
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}