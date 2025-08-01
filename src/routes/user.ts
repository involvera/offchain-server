import axios from 'axios'
import express from 'express'
import { alias, AliasModel, SocietyModel } from '../models'
import { CheckIfSocietyIDExistsByRouteParam } from './society'
import { GenerateRandomUsername } from 'username-creator'
import { Inv } from 'wallet-util'

const fetchUserWalletInfo = async (society: SocietyModel, addr: Inv.Address) => {
    try {
        const response = await axios(society.get().currencyRouteAPI() + '/wallet/' + addr.toPKH().hex(), {
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
    CheckIfSocietyIDExistsByRouteParam,
    async (req: express.Request, res: express.Response) => {
        const address = new Inv.Address(req.params.address)
        const s = res.locals.society as SocietyModel
        
        try {
            const a = await alias.findByAddress(address)
            const response = await fetchUserWalletInfo(s, address)
            if (response.status == 200){
                res.status(200).json({
                    alias: !!a ? a.to().filterGroup('author').plain() : AliasModel.defaultAliasWithAuthorGroup(address),
                    info: response.data
                })
            } else {
                res.status(response.status)
                res.json(response.data)
            }
        } catch (e){
            res.status(500).json(e.toString())
        }
    })

    server.get('/user/name', async (req: express.Request, res: express.Response) => {
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

        res.status(200).json(username + suffix)
    })

}