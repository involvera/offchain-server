import express from 'express'
import { alias, proposal, society, SocietyModel, thread, reward } from '../models'
import { ADMIN_KEY, IS_PRODUCTION } from '../static'


export const CheckIsDevelopment = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (IS_PRODUCTION){
        res.status(401)
        res.json({error: `Not development environment`})
        return
    }
    next()
}

export const CheckAdminKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { admin_key } = req.headers

    if (admin_key != ADMIN_KEY){
        res.status(401)
        res.json({error: `You can't perform this action.`})
        return
    } 
    next()
}


export default (server: express.Express) => {

    server.post('/admin/:sid/reset', 
    CheckAdminKey,
    CheckIsDevelopment,
    async (req: express.Request, res: express.Response) => {
        const { sid } = req.params
        try {
            let s = await society.fetchByID(parseInt(sid)) as SocietyModel
            if (s){
                await reward.quick().remove({sid: s.get().ID() })
                await thread.quick().remove({sid: s.get().ID() })
                await proposal.quick().remove({sid: s.get().ID() })
                await alias.sql().remove().all()
                res.sendStatus(200)
                return
            }
        } catch (err){
            res.status(500)
            res.json(err.toString())
        }
    })
}