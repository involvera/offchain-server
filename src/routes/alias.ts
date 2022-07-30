import express from 'express'
import { ToPubKeyHash, GetAddressFromPubKeyHash, VerifySignatureHex, Sha256 } from 'wallet-util'
import { alias, AliasModel } from '../models' 
import { INTERVAL_DAY_CHANGE_ALIAS_USERNAME } from '../static'
import { downloadDistantImage, downloadLocalImage } from '../utils'

export const CheckIfAliasExistByBody = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { author } = req.body

    const a = await alias.findByAddress(author)
    if (!a){
        res.status(404)
        res.json({error: "You need to create an alias on your address before adding content."})
        return
    }
    res.locals.alias = a
    next()
}

export const CheckIfAliasExistByURLParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { address } = req.params

    const a = await alias.findByAddress(address)
    if (!a){
        res.sendStatus(404)
        return
    }
    res.locals.alias = a
    next()
}

export const checkSignatureOnBody = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { signature, public_key } = req.headers

    if (VerifySignatureHex({signature_hex: signature as string, public_key_hex: public_key as string}, Buffer.from(JSON.stringify(req.body)))){
        next()
    } else {
        res.status(401)
        res.json({error: `Wrong signature on content.`})
    }
}

const updateUsername = async (req: express.Request, res: express.Response) => {
    const { public_key } = req.headers
    const pkh = ToPubKeyHash(Buffer.from(public_key as string, 'hex'))
    const address = GetAddressFromPubKeyHash(pkh)
    const { username } = req.body
    
    const isUpdatingUsername = (a: AliasModel) => username !== a.get().username()

    const isAllowedToUpdateUsername = (a: AliasModel) => {
        const nDaysAgo = new Date(new Date().getTime() - (INTERVAL_DAY_CHANGE_ALIAS_USERNAME * 1000 * 3600 * 24))
        return !isUpdatingUsername(a) || a.get().lastUsernameUpdate() < nDaysAgo
    }

    const getRightState = (a: AliasModel | null) => {
        if (!a)
            return {
                address, username,
                last_username_update: new Date('2000/01/01')
            }

        const ret: any = { address }
        if (isUpdatingUsername(a)){
            ret.username = username
            ret.last_username_update = new Date()
        }
        return ret
    }

    try {
        let a = await alias.quick().find({ address }) as AliasModel
        if (!a){
            a = await alias.quick().create(getRightState(null)) as AliasModel
            res.status(201)
        } else {
            if (!isAllowedToUpdateUsername(a)){
                res.status(401)
                res.json(`you already updated your username less than ${INTERVAL_DAY_CHANGE_ALIAS_USERNAME} days ago.`)
                return
            }
            await a.setState(getRightState(a)).saveToDB()
            res.status(200)
        }
        res.json(a.to().plain())
    } catch (err){
        res.status(500)
        res.json(err.toString())
    }
}

export const updatePP = async (req: express.Request, res: express.Response) => {
    const { public_key } = req.headers
    const pkh = ToPubKeyHash(Buffer.from(public_key as string, 'hex'))
    const address = GetAddressFromPubKeyHash(pkh)
    const { pp, pp500, asset_name } = req.body

    const compare = async (size: 64 | 500) => {
        const local = await downloadLocalImage(asset_name, size)
        const distant = await downloadDistantImage((size === 500 ? pp500 : pp) || '')
        return Buffer.isBuffer(local) && Buffer.isBuffer(distant) && local.equals(distant)
    }

    if (!await compare(64) || !await compare(500)){
        res.status(401)
        res.json("image previously built doesn't match distant image")
        return
    }

    const isAllowedToUpdatePP = (a: AliasModel) => {
        const nDaysAgo = new Date(new Date().getTime() - (INTERVAL_DAY_CHANGE_ALIAS_USERNAME * 1000 * 3600 * 24))
        return a.get().lastPPUpdate() < nDaysAgo
    }

    const getRightState = (a: AliasModel | null) => {
        const ret: any = { address }
        ret.pp = pp
        ret.pp500 = pp500
        ret.last_pp_update = new Date()
        return ret
    }

    try {
        let a = await alias.quick().find({ address }) as AliasModel
        if (!a){
            res.status(404)
            res.send('alias not found, you need to create an username first')
            return
        }
        if (!isAllowedToUpdatePP(a)){
            res.status(401)
            res.json(`you already updated your profil picture less than ${INTERVAL_DAY_CHANGE_ALIAS_USERNAME} days ago.`)
            return
        }
        await a.setState(getRightState(a)).saveToDB()
        res.status(200)
        res.json(a.to().plain())
    } catch (err){
        res.status(500)
        res.json(err.toString())
    }
    res.sendStatus(200)
}


export default (server: express.Express) => {
    const { schemaValidator } = alias.expressTools().middleware()

    server.post('/alias/username', 
        schemaValidator,
        checkSignatureOnBody,
        updateUsername
    )

    server.post('/alias/pp', 
        checkSignatureOnBody,
        updatePP
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

    server.get('/alias/address/:address', async (req: express.Request, res: express.Response) => {
        const { address } = req.params     
        try {
            const a = await alias.quick().find({ address })
            if (!a)
                res.sendStatus(404)
            else {
                res.status(200)
                res.json(a.to().filterGroup('author').plain())
            }
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })
}