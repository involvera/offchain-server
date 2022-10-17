import express from 'express'
import _ from 'lodash'
import { Inv } from 'wallet-util'

import { cachedSocieties, embed, EmbedModel } from '../models' 

export default (server: express.Express) => {

    server.get('/embed/list', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { filter } = req.headers

        interface IProposal {
            sid: number
            index: number
        }
        interface IThread {
            sid: number
            pkh: string
        }

        let ps: IProposal[] = []
        let ts: IThread[] = []
        for (const e of (filter as string).split(';')){
            const splited = e.split(',')
            if (splited.length == 2){
                const s = cachedSocieties.findByPathName(splited[1])
                if (s){
                    try {
                        const pkh = Inv.PubKH.fromHex(splited[0])
                        ts.push({pkh: pkh.hex(), sid: s.get().ID()})
                    } catch {
                        const index = parseInt(splited[0])
                        index != NaN && ps.push({index, sid: s.get().ID()})
                    }
                }
            }
        }
        ps = _.uniq(ps)
        ts = _.uniq(ts)


        const ret = await Promise.all([
            ps.length > 0 ? embed.pullBySidsAndIndexes(ps.map((v) => v.sid), ps.map((v) => v.index)) : null,
            ts.length > 0 ? embed.pullBySidsAndPKHs(ts.map((v) => v.sid), ts.map((v) => v.pkh)) : null
        ])

        const proposals = ps.length > 0 ? ret[0].local().map((e: EmbedModel) => e.get().content()) : []
        const threads = ts.length > 0 ? ret[1].local().map((e: EmbedModel) => e.get().content()) : []
 
        res.status(200).json({
            proposals,
            threads
        })
    })
}