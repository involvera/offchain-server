import express from 'express'
import alias from '../models/alias' 
import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1');
import { bodyAssignator} from '../utils'
import {ToPubKeyHash } from 'wallet-util'

export const checkSignatureOnUsername = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { signature, public_key } = req.headers
    const { username } = req.body

    if (!ec.verify(Buffer.from(username), Buffer.from(signature as string, 'hex'), Buffer.from(public_key as string, 'hex'))){
        res.status(401)
        res.json({error: `Wrong signature on username.`})
        return
    }
    next()
}

export default (server: express.Express) => {
    const { schemaValidator } = alias.expressTools().middleware()

    server.post('/alias', 
        bodyAssignator((req: express.Request) => {
            return { public_key_hashed: ToPubKeyHash(Buffer.from(req.headers.public_key as string, 'hex')).toString('hex')  }
        }),
        schemaValidator,
        checkSignatureOnUsername,
        async (req: express.Request, res: express.Response) => {
            const {public_key_hashed} = req.body

            try {
                let a = await alias.quick().find({ public_key_hashed })
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
}