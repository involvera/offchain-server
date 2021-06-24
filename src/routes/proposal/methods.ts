import express from 'express'
import { proposal, ProposalCollection, ProposalModel } from '../../models'

export const PostProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const p = await proposal.quick().create(req.body) as ProposalModel
        p.prepareJSONRendering()
        res.status(201)
        res.json(p.to().plain())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}

export const GetProposalList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await proposal.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string)) as ProposalCollection
        res.status(200)
        list.prepareJSONRendering()
        res.json(list.local().to().filterGroup('author').plain())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}