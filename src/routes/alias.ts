import express from 'express'
import { Inv } from 'wallet-util'
import { alias, AliasModel } from '../models' 
import { INTERVAL_SEC_CHANGE_ALIAS } from '../static'
import { downloadDistantImage, downloadLocalImage } from '../utils'

export const CheckIfAliasExistByBody = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { author } = req.body

    const a = await alias.findByAddress(author)
    if (!a){
        res.status(404).json({error: "You need to create an alias on your address before adding content."})
        return
    }
    res.locals.alias = a
    next()
}

export const CheckIfAliasExistByURLParam = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const address = new Inv.Address(req.params.address)

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
    const sig = new Inv.Signature({ signature, public_key } as any)
    sig.verify(JSON.stringify(req.body)) ? next() : res.status(401).json({error: `Wrong signature on content.`})
}

const updateUsername = async (req: express.Request, res: express.Response) => {
    const pubKey = Inv.PubKey.fromHex(req.headers.public_key as string)
    const address = pubKey.hash().toAddress().get()
    const { username } = req.body
    
    try {
        alias.newNode(undefined).mustValidateSchema({ username, address })
    } catch (err){
        res.status(422).json({ error: err.toString() })
        return
    }

    const isUpdatingUsername = (a: AliasModel) => username !== a.get().username()

    const isAllowedToUpdateUsername = (a: AliasModel) => {
        const nDaysAgo = new Date(new Date().getTime() - (INTERVAL_SEC_CHANGE_ALIAS() * 1000))
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
                res.status(401).json(`you already updated your username recently, please try again later`)
                return
            }
            await a.setState(getRightState(a)).saveToDB()
            res.status(200)
        }
        res.json(a.to().plain())
    } catch (err){
        res.status(500).json(err.toString())
    }
}

export const updatePP = async (req: express.Request, res: express.Response) => {
    const pubKey = Inv.PubKey.fromHex(req.headers.public_key as string)
    const address = pubKey.hash().toAddress().get()
    const { pp, pp500, asset_name } = req.body

    const compare = async (size: 64 | 500) => {
        const local = await downloadLocalImage(asset_name, size)
        const distant = await downloadDistantImage((size === 500 ? pp500 : pp) || '')
        return Buffer.isBuffer(local) && Buffer.isBuffer(distant) && local.equals(distant)
    }

    const isAllowedToUpdatePP = (a: AliasModel) => {
        const nDaysAgo = new Date(new Date().getTime() - (INTERVAL_SEC_CHANGE_ALIAS() * 1000))
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
        if (!await compare(64) || !await compare(500)){
            res.status(401).json("image previously built doesn't match distant image")
            return
        }
    } catch (e){
        res.status(500).json(e.toString())
        return
    }

    let a: AliasModel
    try {
        a = await alias.quick().find({ address }) as AliasModel
        if (!a){
            res.status(404).send('alias not found, you need to create an username first')
            return
        }
        if (!isAllowedToUpdatePP(a)){
            res.status(401).json(`you already updated your profil picture recently, please try again later`)
            return
        }
    } catch (e) {
        res.status(500).json(e.toString())
        return
    }

    try {
        alias.newNode(undefined).mustValidateSchema({ username: a.get().username(), address, pp, pp500 })
    } catch (err){
        res.status(422).json({ error: err.toString() })
        return
    }

    try {
        await a.setState(getRightState(a)).saveToDB()
        res.status(200).json(a.to().plain())
    } catch (err){
        res.status(500).json(err.toString())
    }
}


export default (server: express.Express) => {

    server.post('/alias/username',
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
            res.status(500).json(e.toString())
        }
    })

    server.get('/alias/:username/pp/500', async (req: express.Request, res: express.Response) => { 
        const { username } = req.params     
        try {
            const a = await alias.findByUsername(username)
            if (!a){
                res.sendStatus(404)
            } else {
                res.status(200).send(a.get().pp500URI())
            }
        } catch (e){
            res.status(500).json(e.toString())
        }
    })

    server.get('/alias/address/:address', async (req: express.Request, res: express.Response) => {
        const { address } = req.params     
        try {
            const a = await alias.quick().find({ address })
            if (!a)
                res.sendStatus(404)
            else {
                res.status(200).json(a.to().filterGroup('author').plain())
            }
        } catch (e){
            res.status(500).json(e.toString())
        }
    })
}