import { Joi, Collection, Model } from 'elzeard'

export class SocietyModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(2).max(30).trim().replace(/\s\s+/, ' ').required().example('Involvera'),
        path_name: Joi.string().min(3).max(20).lowercase().regex(/[\w\s\d]*/).unique().required().example('involvera'),
        currency_route_api: Joi.string().uri().max(255).unique().required().example('https://165.123.232.121:1001'),
        currency_symbol: Joi.string().min(2).max(5).alphanum().required().example('cInv'),
        description: Joi.string().max(140).trim().replace(/\n/g, '').replace(/\s\s+/g, ' ').example('A community platform that hierarchize members with decentralized governance based on a liquid economy.'),
        domain: Joi.string().hostname().example('involvera.com'),
        created_at: Joi.date().default('now'),
    })

    constructor(initialState: any, options: any){
        super(initialState, SocietyModel, options)
    }

    get = () => {
        return {
            ID: (): number => this.state.id,
            name: (): string => this.state.name,
            currencyRouteAPI: (): string => this.state.currency_route_api,
            currencySymbol: (): string => this.state.currency_symbol,
            description: (): string => this.state.description,
            domain: (): string => this.state.domain,
            createdAt: (): Date => this.state.created_at,
        }
    }
}

export class SocietyCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [SocietyModel, SocietyCollection], options)
    }

    fetchByID = async (id: number) => await this.quick().find({id})
}


export default new SocietyCollection([], {table: 'societies'})