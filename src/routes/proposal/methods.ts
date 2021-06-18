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
