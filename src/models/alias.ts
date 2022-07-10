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
        address: Joi.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/).max(39).unique().required().group(['author']),
        created_at: Joi.date().default('now'),
        pp: Joi.string().max(255).group(['author']),
        username: Joi.string().max(16).lowercase().regex(/^[a-z0-9_]{3,16}$/).unique().group(['author']),
        last_username_update: Joi.date().default(() => new Date(0))
    })

    constructor(initialState: any, options: any){
        super(initialState, AliasModel, options)
    }

    get = () => {
        return {
            ID: (): number => this.state.id,
            address: (): string => this.state.address,
            ppURI: (): string | null => this.state.pp,
            username: (): string => this.state.username,
            createdAt: (): Date => this.state.created_at,
            lastUsernameUpdate: (): Date => this.state.last_username_update
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