import { Joi, Collection, Model } from 'elzeard'

interface IAuthor {
    pp: string | null
    username: string
    address: string
}

export class AliasModel extends Model {

    static defaultAliasWithAuthorGroup = (address: string): IAuthor => {
        return {
            pp: null,
            username: '',
            address
        }
    }

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        origin_sid: Joi.number().foreignKey('societies', 'id').default(1).noPopulate().required(),
        created_at: Joi.date().default('now'),

        last_username_update: Joi.date().default(() => new Date(0)),
        last_pp_update: Joi.date().default(() => new Date(0)),

        address: Joi.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/).max(39).unique().required().group(['author']),
        pp: Joi.string().max(255).group(['author']),
        pp500: Joi.string().max(255),
        username: Joi.string().max(16).lowercase().regex(/^[a-z0-9_]{3,16}$/).unique().group(['author']),
    })

    constructor(initialState: any, options: any){
        super(initialState, AliasModel, options)
    }

    get = () => {
        return {
            ID: (): number => this.state.id,
            createdAt: (): Date => this.state.created_at,
            originSID: (): number => this.state.origin_sid,

            address: (): string => this.state.address,
            ppURI: (): string | null => this.state.pp,
            pp500URI: (): string | null => this.state.pp500,
            username: (): string => this.state.username,
            
            lastUsernameUpdate: (): Date => this.state.last_username_update,
            lastPPUpdate: (): Date => this.state.last_pp_update
        }
    }
}

export class AliasCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [AliasModel, AliasCollection], options)
    }

    findByAddress = async (address: string) => await this.quick().find({address}) as AliasModel
    findByUsername = async (username: string) => await this.quick().find({username}) as AliasModel
    pullByAddresses = async (addresses: string[]) => await this.copy().sql().pull().whereIn('address', addresses).run() as AliasCollection
}

export default new AliasCollection([], {table: 'aliases'})