import axios from 'axios'
import express from 'express'
import { alias, AliasModel, SocietyModel } from '../models'
import { CheckIfSocietyExistsByRouteParam } from './society'
import { PubKeyHashFromAddress } from 'wallet-util'
import { CheckIfAliasExistByURLParam } from './alias'
import { GenerateRandomUsername } from 'username-creator'


const fetchUserWalletInfo = async (society: SocietyModel, address: string) => {
    const pkhHex = PubKeyHashFromAddress(address).toString('hex')
    try {
        const response = await axios(society.get().currencyRouteAPI() + '/wallet/' + pkhHex, {
            method: 'GET',
            validateStatus: function (status) {
                return status >= 200 && status <= 500
            }
        })
        return {status: response.status, data: response.data}
    } catch (e){
        return {status: 500, data: e.toString()}
    }
}

export default (server: express.Express) => {

    server.get('/user/:sid/:address', 
    CheckIfSocietyExistsByRouteParam,
    CheckIfAliasExistByURLParam,
    async (req: express.Request, res: express.Response) => {
        const a = res.locals.alias as AliasModel
        const s = res.locals.society as SocietyModel
        
        try {
            const response = await fetchUserWalletInfo(s, a.get().address())
            if (response.status == 200){
                res.status(200)
                res.json({
                    alias: a.to().filterGroup('author').plain(),
                    info: response.data
                })
            } else {
                res.status(response.status)
                res.json(response.data)
            }
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })

    server.get('/user/name', async (req: express.Request, res: express.Response) => {
        console.log('yes?')
        let username = GenerateRandomUsername()
        let suffix = ''
        let nAttempt = 0
        const MAX_ATTEMPT = 10
        const MAX_USERNAME_LENGTH = 16
        while (true){
            const a = await alias.findByUsername(username+suffix)
            if (!a)
                break;
            else {
                if (/\d/.test(username) || username.length === MAX_USERNAME_LENGTH || nAttempt === MAX_ATTEMPT){
                    username = GenerateRandomUsername();
                    suffix = '';
                    nAttempt = 0
                } else {
                    suffix = Math.pow(10, Math.min(3, MAX_USERNAME_LENGTH - username.length)).toString()
                    nAttempt++
                } 
            }
        }

        res.status(200)
        res.json(username + suffix)
    })

}