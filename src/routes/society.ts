import express from 'express'
import { alias, AliasCollection, society, SocietyModel } from '../models' 
import { CheckAdminKey } from './admin'
import fetch from 'node-fetch'

export const CheckIfSocietyExists = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { sid } = req.body 
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

export default (server: express.Express) => {
    const { schemaValidator } = society.expressTools().middleware()
    const { postHandler } = society.expressTools().request()

    server.post('/society', 
        CheckAdminKey,
        schemaValidator,
        postHandler(['name', 'path_name', 'currency_route_api', 'currency_symbol', 'description', 'domain'])
    )

    server.put('/society/:id', 
    CheckAdminKey,
    schemaValidator,
    async (req: express.Request, res: express.Response) => {
        const id = req.params.id        
        try {
            const s = await society.fetchByID(parseInt(id))
            await s.setState(req.body).saveToDB()
            res.status(200)
            res.json(s.to().plain())
        } catch (e){
            res.json(e.toString())
            res.status(500)
        }
    })

    server.get('/society/:id',
    async (req: express.Request, res: express.Response) => {
        const id = req.params.id
        const s = await society.fetchByID(parseInt(id))
        if (!s){
            res.sendStatus(404)
            return
        }
        try {
            const r = await fetch(s.get().currencyRouteAPI() + `/society/stats`)
            if (r.status == 200){
                const stats = await r.json()
                try {
                    const aliases = await alias.pullByAddresses(stats.most_active_addresses)
                    stats.most_active_addresses = aliases.local().to().filterGroup('author').plain()
                    res.json(Object.assign({}, s.to().plain(), {stats}))
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