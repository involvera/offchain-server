import express from 'express'
import axios from 'axios'
import { Constant } from 'wallet-script'

import { SocietyModel, alias, AliasModel } from '../models'
import { CheckIfSocietyIDExistsByRouteParam } from './society'
import { Inv } from 'wallet-util'

export default (server: express.Express) => {


    server.get('/puts/list/:sid', CheckIfSocietyIDExistsByRouteParam, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { signature, pubkey, filter, offset } = req.headers
        
        const s = res.locals.society as SocietyModel

        try {
            const resp = await axios.get(s.get().currencyRouteAPI() + '/puts/list', {
                headers: {
                    signature: signature as string,
                    pubkey: pubkey as string,
                    filter: filter.toString(),
                    offset: offset.toString(),
                },
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            if (resp.status == 200) {
                const userPKH = Inv.PubKey.fromHex(pubkey as string).hash().hex()
                const list = resp.data as any[]
                const addressToFetch: string[] = []

                for (let p of list){
                    const { sender, recipient } = p.pubkh
                    if (p.kind == 0){
                        !!sender && sender != userPKH && addressToFetch.push(Inv.PubKH.fromHex(sender).toAddress().get())
                        !!recipient && recipient != userPKH && recipient != Constant.PUBKEY_H_BURNER && addressToFetch.push(Inv.PubKH.fromHex(recipient).toAddress().get())
                    }
                }
                const aliases = await alias.pullByAddresses(addressToFetch)
                for (let i = 0; i < list.length; i++){
                    const { sender, recipient } = list[i].pubkh
                    if (list[i].kind == 0){
                        const pkhToFind = sender === userPKH ? recipient : sender
                        if (pkhToFind){
                            const a = aliases.local().find((a: AliasModel) => {
                                return a.get().address().get() === Inv.PubKH.fromHex(pkhToFind).toAddress().get()
                            })
                            if (a){
                                list[i].alias = a.to().filterGroup('author').plain()
                                continue
                            }
                        }
                    }
                    list[i].alias = null
                }
                res.status(200).json(list)

            } else {
                res.status(resp.status).json(resp.data)
            }
        } catch(e){
            res.status(500).json(e.toString())
        }
    })


}