import express from 'express'
import society from '../models/society' 
import { IPutHandlerSettings } from 'elzeard'

const ADMIN_KEY = '2f72e55b962b6cd66ea70e8b6bd8657d1c87a23a65769213d76dcb5da6abf6b5'


export const checkAdminKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { admin_key } = req.headers

    if (admin_key != ADMIN_KEY){
        res.status(401)
        res.json({error: `You can't perform this action.`})
        return
    } 
    next()
}

export default (server: express.Express) => {
    const { schemaValidator } = society.expressTools().middleware()
    const { postHandler } = society.expressTools().request()

    server.post('/society', 
        checkAdminKey,
        schemaValidator,
        postHandler(['name', 'path_name', 'currency_route_api', 'currency_symbol', 'description', 'domain'])
    )

    server.put('/society/:id', 
    checkAdminKey,
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
}