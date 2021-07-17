import { Joi, Collection, Model } from 'elzeard'
import { TEmbedType } from 'involvera-content-embedding';

export interface IEmbed {
    content: string
    type: TEmbedType
    public_key_hashed: string
    index?: number
    sid: number
    created_at: Date
}

export class EmbedModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        created_at: Joi.date().default('now'),
        public_key_hashed: Joi.string().length(40).max(40).hex().required(),
        index: Joi.number(),
        type: Joi.string().allow('proposal', 'thread').required(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        content: Joi.string().max(1000)
    })

    constructor(initialState: any, options: any){
        super(initialState, EmbedModel, options)
    }
}

export class EmbedCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [EmbedModel, EmbedCollection], options)
    }
}
