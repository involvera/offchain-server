import express from 'express'
import { society, SocietyModel } from '../models' 
import { CheckAdminKey } from './admin'

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
        if (s){
            res.status(200)
            res.json(s.to().plain())
            return
        }
        res.status(404)
    })

}