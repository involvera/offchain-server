import express from 'express'
import { proposal } from '../../models'

export const GetProposalList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await proposal.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200).json(await list.renderJSON('preview'))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetProposal = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, index } = req.params

    try {
        const p = await proposal.fetchByIndex(parseInt(sid), parseInt(index))
        p ? res.status(200).json(await p.renderJSON('view')) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}