import express from 'express'
import { ToPubKeyHash, GetAddressFromPubKeyHash, VerifySignatureHex } from 'wallet-util'
import { alias } from '../models' 
import { bodyAssignator} from '../utils'

export const checkSignatureOnUsername = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { signature, public_key } = req.headers
    const { username } = req.body

    if (VerifySignatureHex({signature_hex: signature as string, public_key_hex: public_key as string}, Buffer.from(username))){
        next()
    } else {
        res.status(401)
        res.json({error: `Wrong signature on content.`})
    }
}

export default (server: express.Express) => {
    const { schemaValidator } = alias.expressTools().middleware()

    server.post('/alias', 
        bodyAssignator((req: express.Request) => {
            return { address: GetAddressFromPubKeyHash(ToPubKeyHash(Buffer.from(req.headers.public_key as string, 'hex'))) }
        }),
        schemaValidator,
        checkSignatureOnUsername,
        async (req: express.Request, res: express.Response) => {
            const { address } = req.body

            try {
                let a = await alias.quick().find({ address })
                if (!a){
                    a = await alias.quick().create(req.body)
                    res.status(201)
                } else {
                    await a.setState(req.body).saveToDB()
                    res.status(200)
                }
                res.json(a.to().plain())
            } catch (err){
                res.status(500)
                res.json(err.toString())
            }
        }
    )

    server.head('/alias/:username', async (req: express.Request, res: express.Response) => { 
        const { username } = req.params     
        try {
            const a = await alias.findByUsername(username)
            if (!a){
                res.sendStatus(404)
            } else {
                res.sendStatus(200)
            }
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })

    server.get('/alias/addresses/:addresses', async (req: express.Request, res: express.Response) => {
        const addresses = JSON.parse(req.params.addresses)

        try {
            const a = await alias.pullByAddresses(addresses.slice(0, 100))
            res.status(200)
            res.json(a.local().to().filterGroup('author').plain())
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })

    server.get('/alias/address/:address', async (req: express.Request, res: express.Response) => {
        const { address } = req.params     
        try {
            const a = await alias.quick().find({ address: address })
            res.status(200)
            res.json(a.to().filterGroup('author').plain())
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })
}