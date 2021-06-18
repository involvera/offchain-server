import express from 'express'
import proposal from '../../models/proposal'

export const PostProposal = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export const GetProposalList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await proposal.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200)
        res.json(list.local().to().plain())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}