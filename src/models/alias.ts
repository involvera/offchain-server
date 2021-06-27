import { Joi, Collection, Model } from 'elzeard'

export interface IAuthor {
    address: string,
    pp: string
    username: string
}

export class AliasModel extends Model {

    static schema = Joi.object({
        address: Joi.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/).max(39).unique().required().group(['author']),
        created_at: Joi.date().default('now'),
        pp: Joi.string().max(255).group(['author']),
        username: Joi.string().max(16).lowercase().regex(/^[a-z0-9_]{3,16}$/).unique().group(['author'])
    })

    constructor(initialState: any, options: any){
        super(initialState, AliasModel, options)
    }
    
    get = () => {
        return {
            ID: () => this.state.id,
            address: () => this.state.address,
            ppURI: () => this.state.pp,
            sid: () => this.state.sid,
            username: () => this.state.username,
            createdAt: () => this.state.created_at,
        }
    }
}

export class AliasCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [AliasModel, AliasCollection], options)
    }

    findByAddress = (address: string) => this.quick().find({address})
}

export default new AliasCollection([], {table: 'aliases'})