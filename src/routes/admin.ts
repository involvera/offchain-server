import express from 'express'
import { alias, proposal, SocietyModel, thread, embed } from '../models'
import { ServerConfiguration } from '../static/config'
import { initCachedData } from '../init'
import { CheckIfSocietyIDExistsByRouteParam } from './society'

export const CheckIsDevelopment = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (ServerConfiguration.production){
        res.status(401).json({error: `not development environment`})
        return
    }
    next()
}

export const CheckAdminKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { admin_key } = req.headers

    if (admin_key != ServerConfiguration.admin_key){
        res.status(401).json({error: `you cannot perform this action`})
        return
    } 
    next()
}

export default (server: express.Express) => {
    server.post('/admin/:sid/reset', 
    CheckAdminKey,
    CheckIsDevelopment,
    CheckIfSocietyIDExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            if (s){
                await thread.quick().remove({sid: s.get().ID() })
                await proposal.quick().remove({sid: s.get().ID() })
                await embed.quick().remove({sid: s.get().ID() })
                await alias.quick().remove({origin_sid: s.get().ID()})
                await initCachedData()
                res.sendStatus(200)
                return
            }
        } catch (err){
            console.log(err)
            res.status(500).json(err.toString())
        }
    })
}