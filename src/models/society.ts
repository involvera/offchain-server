import { Joi, Collection, Model } from 'elzeard'

export class SocietyModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(2).max(30).trim().alphanum().unique().replace(/\s\s+/g, ' ').required().example('Involvera'),
        currency_route_api: Joi.string().uri().unique().required().example('https://165.123.232.121:1001'),
        currency_symbol: Joi.string().min(2).max(5).trim().alphanum().replace(/\s\s+/g, ' ').unique().required().example('cInv'),
        description: Joi.string().max(140).trim().replace(/\n/g, '').replace(/\s\s+/g, ' ').example('A community platform that hierarchize members with decentralized governance based on a liquid economy.'),
        domain: Joi.string().hostname().example('involvera.com'),
        created_at: Joi.date().default('now'),
    })

    constructor(initialState: any, options: any){
        super(initialState, SocietyModel, options)
    }

    get = () => {
        return {
            ID: () => this.state.id,
            name: () => this.state.name,
            currencyRouteAPI: () => this.state.currency_route_api,
            currencySymbol: () => this.state.currency_symbol,
            description: () => this.state.description,
            domain: () => this.state.domain,
            createdAt: () => this.state.created_at,
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