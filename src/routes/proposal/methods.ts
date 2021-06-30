import express from 'express'
import { proposal } from '../../models'

export const GetProposalList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await proposal.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200)
        res.json(list.renderJSON())
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}