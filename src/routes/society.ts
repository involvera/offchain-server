import express from 'express'
import { alias, society, SocietyModel } from '../models' 
import { CheckAdminKey } from './admin'
import fetch from 'node-fetch'

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
export const CheckIfSocietyExistsByRouteParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    
    await getSocietyIfExists(parseInt(req.params.sid), req, res, next)
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
            const r = await fetch(s.get().currencyRouteAPI() + `/society/stats`)
            if (r.status == 200){
                const stats = await r.json()
                try {
                    const aliases = await alias.pullByAddresses(stats.most_active_addresses)
                    stats.most_active_addresses = aliases.local().to().filterGroup('author').plain()
                    const o = {
                        constitution: stats.constitution,
                        costs: stats.costs
                    }
                    delete stats.constitution
                    delete stats.costs
                    res.json(Object.assign({}, s.to().plain(), {stats}, o))
                    res.status(200)
                    return
                } catch (e){
                    res.status(500)
                    res.json(e.toString())
                    return
                }
            }
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })
}