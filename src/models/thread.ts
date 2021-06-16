import { Joi, Collection, Model } from 'elzeard'

export class ThreadModel extends Model {

    static schema = Joi.object({
        id: Joi.string().uuid().required(),
        created_at: Joi.date().default('now'),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        link: Joi.string().max(500).required(),
        title: Joi.string().max(140).required(),
        content: Joi.string().max(5000).required()
    })

    constructor(initialState: any, options: any){
        super(initialState, ThreadModel, options)
    }
}

export class ThreadCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }
}

export default new ThreadCollection([], {table: 'threads'})