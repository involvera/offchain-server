import express from 'express'
import { embed, EmbedCollection, proposal, thread } from '../models' 

export default (server: express.Express) => {

    server.get('/embed/:sid/thread/:pkh', 
        async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const { pkh, sid } = req.params
            try {
                const e = await embed.fetchByPKH(parseInt(sid), pkh)
                if (e){
                    res.status(200)
                    res.json(e.to().plain())
                } else {
                    const t = await thread.fetchByPubKH(parseInt(sid), pkh)
                    if (t){
                        const e = await embed.create().thread(t)
                        if (e){
                            res.status(200)
                            res.json(e.to().plain())
                            return
                        }
                    }
                    res.sendStatus(404)
                }
            } catch (e){
                res.status(500)
                res.json(e.toString())
            }
        }
    )

    server.put('/embed/:sid/text', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { sid } = req.params
        const { content } = req.body

        try {
            const embeds = await EmbedCollection.FetchEmbeds(content, parseInt(sid))
            res.status(200)
            res.json(embeds.local().to().filterGroup('preview').plain().map((c: any) => c.content))
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })

    server.get('/embed/:sid/proposal/:index', 
        async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const { index, sid } = req.params
            try {
                const e = await embed.fetchByIndex(parseInt(sid), parseInt(index))
                if (e){
                    res.status(200)
                    res.json(e.to().plain())
                } else {
                    const p = await proposal.fetchByIndex(parseInt(sid), parseInt(index))
                    if (p){
                        const e = await embed.create().proposal(p)
                        if (e){
                            res.status(200)
                            res.json(e.to().plain())
                            return
                        }
                    }
                    res.sendStatus(404)
                }
            } catch (e){
                res.status(500)
                res.json(e.toString())
            }
        }
    )

    server.get('/embed/list/:ids', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const ids = JSON.parse(req.params.ids)
        try {
            const list = await embed.pullByIDs(ids)
            res.status(200)
            res.json(list.local().to().plain())
        } catch (e){
            res.status(500)
            res.json(e.toString())  
        }
    })
}