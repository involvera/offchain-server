import express from 'express'
import { UUIDToPubKeyHashHex } from 'wallet-util'
import { thread } from '../../models'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page } = req.headers

    try {
        const list = await thread.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200).json(await list.renderJSON('preview'))
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const GetThread = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid, pubkh } = req.params

    try {
        const t = await thread.fetchByPubKH(parseInt(sid), pubkh)
        t ? res.status(200).json(await t.renderJSON('view')) : res.sendStatus(404)
    } catch (e){
        res.status(500).json(e.toString())
    }
}