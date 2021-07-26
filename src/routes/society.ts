import express from 'express'
import { alias, cachedSocieties, society, SocietyModel } from '../models' 
import { CheckAdminKey } from './admin'
import { IContentLink } from './interfaces'

const getSocietyIfExists = async (sid: number, req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const s = await society.fetchByID(sid) 
        if (!s){
            res.sendStatus(404)
            return
        }
        res.locals.society = s
        next()
    } catch (e){
        res.status(500)
        res.json(e.toString())
    }
}

export const CheckIfSocietyExistsByBodyParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => await getSocietyIfExists(req.body.sid, req, res, next)
export const CheckIfSocietyExistsByRouteParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => await getSocietyIfExists(parseInt(req.params.sid), req, res, next)
export const CheckIfLughHeightHasChanged = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { content_link, lugh_height } = req.body
    const s = res.locals.society as SocietyModel
    const so = cachedSocieties.local().find({id: s.get().ID()}) as SocietyModel
    let b = false
    if (!!lugh_height){
        if (so.get().stats().stats.last_height < lugh_height)
            b = true
    }
    if (!!content_link){
        if ((content_link as IContentLink).link.lh < lugh_height)
            b = true
    }
    if (b){
        await so.fetchMembers()
        await so.fetchStats()
    }
    next()
}

export default (server: express.Express) => {
    const { schemaValidator } = society.expressTools().middleware()
    const { postHandler } = society.expressTools().request()

    server.post('/society', 
        CheckAdminKey,
        schemaValidator,
        postHandler(['name', 'path_name', 'currency_route_api', 'currency_symbol', 'description', 'domain'])
    )

    server.put('/society/:sid', 
    CheckAdminKey,
    schemaValidator,
    CheckIfSocietyExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            await s.setState(req.body).saveToDB()
            res.status(200)
            res.json(s.to().plain())
        } catch (e){
            res.json(e.toString())
            res.status(500)
        }
    })

    server.get('/society/:sid',
    CheckIfSocietyExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            const list = await s.fetchStats()
            const aliases = await alias.pullByAddresses(list.stats.most_active_addresses)
            list.stats.most_active_addresses = aliases.local().to().filterGroup('author').plain()
            res.status(200)
            res.json(list)
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })
}