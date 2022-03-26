import _ from 'lodash'
import Express from 'express'
import { IHeaderSignature } from 'community-coin-types'

export const bodyAssignator = (callback: (request: Express.Request) => any) => {
    return async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => { 
        req.body = Object.assign(req.body, callback(req))
        next()
    }
}

export const MixArraysToArrayObj = (keys: string[], ...arrays: any[]): any[] => {

    if (keys.length != arrays.length){
        throw new Error("keys and arrays length have a different length")
    }
    if (keys.length == 0){
        return []
    }
    const refLength = arrays[0].length
    for (let i = 1; i < arrays.length; i++){
        if (refLength != arrays[i].length)
            throw new Error("arrays are not all equal")           
    }

    const ret = new Array(refLength)
    _.fill(ret, {})
    for (let i = 0; i < keys.length; i++){
        const key = keys[i]
        for (let j = 0; j < arrays[i].length; j++){
            ret[j] = Object.assign({}, ret[j], {[key]: arrays[i][j]})
        }
    }
    return ret
}

export const ArrayObjToDoubleArray = (a: any[], keys: string[]) => {
    const ret: any[][] = []
    for (let o of a)
        ret.push(keys.map((key) => o[key]))
    return ret
}

export const getHeaderSignature = (req: Express.Request): IHeaderSignature | void => {
    const { signature, pubkey } = req.headers
    let headerSig: IHeaderSignature = undefined
    if (signature && pubkey){
        headerSig = {signature: signature as string, pubkey: pubkey as string}
    }
    return headerSig
}