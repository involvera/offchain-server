import Express from 'express'

export const bodyAssignator = (callback: (request: Express.Request) => any) => {
    return async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => { 
        req.body = Object.assign(req.body, callback(req))
        next()
    }
}

export const ArrayObjToDoubleArray = (a: any[], keys: string[]) => {
    const ret: any[][] = []
    for (let o of a)
        ret.push(keys.map((key) => o[key]))
    return ret
}