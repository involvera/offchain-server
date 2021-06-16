import { Joi, Collection, Model } from 'elzeard'

export class ProposalModel extends Model {
    static schema = Joi.object({
        id: Joi.string().uuid().required(),
        created_at: Joi.date().default('now'),
        index: Joi.number().required(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        link: Joi.string().max(500).required(),
        vote: Joi.string(),
        title: Joi.string().max(140).required(),
        content: Joi.string().max(15000).required()
    })

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}

export class ProposalCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }
}

export default new ProposalCollection([], {table: 'proposals'})