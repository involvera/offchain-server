import express from 'express'
import { thread } from '../../models'
import { FETCHING_FILTER_TYPES, T_FETCHING_FILTER } from '../../static/types'

export const GetThreadList = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { page, filter } = req.headers

    const FILTER = FETCHING_FILTER_TYPES.includes(filter as string) ? filter as T_FETCHING_FILTER : 'full'

    try {
        const list = await thread.pullBySID(parseInt(req.params.sid), !page ? 0 : parseInt(page as string))
        res.status(200)
        res.json(list.renderJSON(FILTER))
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}