import { Joi, Collection, Model } from 'elzeard'
import { AliasModel } from './alias'

export class RewardModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['preview', 'view', 'full']),
        author: Joi.string().foreignKey('aliases', 'address', 'author').group(['view', 'full']),

        category: Joi.number().allow(0, 1, 2, 3).default(0).required().group(['preview', 'view', 'full']),
        tx_id: Joi.string().length(64).max(64).hex().required().group(['full']),
        vout: Joi.number().min(0).max(100).required().group(['full']).default(0),
        target_pkh: Joi.string().length(40).max(40).hex().required().group(['preview', 'view', 'full']),

        created_at: Joi.date().required().group(['preview', 'view', 'full']).default('now'),
    })

    constructor(initialState: any, options: any){
        super(initialState, RewardModel, options)
    }
    
    get = () => {
        return {
            ID: (): number => this.state.id,
            sid: (): number => this.state.sid,
            author: (): AliasModel => this.state.author,
            category: (): 0 | 1 | 2 | 3 => this.state.category,
            txID: (): string => this.state.tx_id,
            vout: (): number => this.state.vout,
            targetPKH: (): string => this.state.target_pkh,
            createdAt: (): Date => this.state.created_at
        }
    }
}

export class RewardCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [RewardModel, RewardCollection], options)
    }

    fetchByTxIDAndVout = async (sid: number, tx_id: string, vout: number) => await this.quick().find({sid, tx_id, vout}) as RewardModel
}

export default new RewardCollection([], {table: 'rewards'})