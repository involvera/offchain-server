import { OFFCHAIN } from 'community-coin-types'
import express from 'express'
import { alias, cachedSocieties, society, SocietyModel } from '../models' 
import { CheckAdminKey , CheckIsDevelopment } from './admin'

const getSocietyIfExists = async (sid: number, res: express.Response, next: express.NextFunction) => {
    try {
        const s = await cachedSocieties.local().find({id: sid}) as SocietyModel
        if (!s){
            res.sendStatus(404)
            return
        }
        res.locals.society = s
        next()
    } catch (e){
        res.status(500).json(e.toString())
    }
}

export const CheckIfSocietyIDExistsByBodyParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => await getSocietyIfExists(req.body.sid, res, next)
export const CheckIfSocietyIDExistsByRouteParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => await getSocietyIfExists(parseInt(req.params.sid), res, next)

export default (server: express.Express) => {
    const { schemaValidator } = society.expressTools().middleware()
    const { postHandler } = society.expressTools().request()

    server.post('/society', 
        CheckAdminKey,
        CheckIsDevelopment,
        schemaValidator,
        postHandler(['name', 'path_name', 'currency_route_api', 'currency_symbol', 'description', 'domain'], {
            callback: (status, m) => {
                status == 201 && cachedSocieties.local().push(m.to().plain())
            }
        })
    )

    server.put('/society/:sid', 
    CheckAdminKey,
    CheckIsDevelopment,
    schemaValidator,
    CheckIfSocietyIDExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            await s.setState(req.body).saveToDB()
            res.status(200).json(s.to().plain())
        } catch (e){
            res.status(500).json(e.toString())
        }
    })

    server.get('/society/:sid',
    CheckIfSocietyIDExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const s = res.locals.society as SocietyModel
        try {
            const stats = await s.pullStats()
            const json: OFFCHAIN.ISociety = {
                stats: stats.stats,
                costs: stats.costs,
                constitution: stats.constitution,
                pp: null,
                id: s.get().ID(),
                currency_route_api: s.get().currencyRouteAPI(),
                name: s.get().name(),
                path_name: s.get().pathName(),
                created_at: s.get().createdAt(),
                currency_symbol:s.get().currencySymbol(),
                domain: s.get().domain(),
                description: s.get().description(),
            }
            res.status(200).json(json)
        } catch (e){
            res.status(500).json(e.toString())
        }
    })
}