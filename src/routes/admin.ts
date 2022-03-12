import express from 'express'
import { alias, proposal, society, SocietyModel, thread, embed, cachedSocieties } from '../models'
import { ADMIN_KEY, IS_PRODUCTION } from '../static'
import { initCachedData } from '../init'
import { CheckIfSocietyExistsByRouteParam } from './society'

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
    CheckIfSocietyExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            if (s){
                await thread.quick().remove({sid: s.get().ID() })
                await proposal.quick().remove({sid: s.get().ID() })
                await alias.quick().remove('id', '<', 2_000_000_000)
                await embed.quick().remove({sid: s.get().ID() })
                await initCachedData()
                res.sendStatus(200)
                return
            }
        } catch (err){
            res.status(500)
            console.log(err)
            res.json(err.toString())
        }
    })
}