import { Joi, Collection, Model } from 'elzeard'

export class AliasModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        public_key_hashed: Joi.string().hex().length(40).max(40).unique().required().group(['author']),
        created_at: Joi.date().default('now'),
        pp: Joi.string().max(255).group(['author']),
        username: Joi.string().min(3).max(16).lowercase().regex(/[\w\_]*/).required().unique().group(['author'])
    })

    constructor(initialState: any, options: any){
        super(initialState, AliasModel, options)
    }
    
    get = () => {
        return {
            ID: () => this.state.id,
            pubKeyHashed: () => this.state.public_key_hashed,
            ppURI: () => this.state.pp,
            username: () => this.state.username,
            createdAt: () => this.state.created_at,
        }
    }
}

export class AliasCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [AliasModel, AliasCollection], options)
    }

    //Hex string format
    findByPKH = (public_key_hashed: string) => this.quick().find({public_key_hashed})
}

export default new AliasCollection([], {table: 'aliases'})