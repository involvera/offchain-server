import { Joi, Collection, Model } from 'elzeard'
import alias from './alias'

export class ProposalModel extends Model {
    static schema = Joi.object({

        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        public_key: Joi.string().max(70).hex().required(),
        signature: Joi.string().max(200).hex().required(),
        title: Joi.string().max(140).required(),
        content: Joi.string().max(15000).required(),

        index: Joi.number().required(),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author'),
        content_link: Joi.string().required(),
        vote: Joi.string().required(),
        created_at: Joi.date().default('now')
    })

    get = () => {
        return {
            sid: () => this.state.sid,
        }
    }
    prepareJSONRendering = () => {
        this.setState({
            content_link: JSON.parse(this.state.content_link),
            vote: JSON.parse(this.state.vote),
            content: this.state.content.split('~~~_~~~_~~~_~~~')
        }, true)
    }

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}

export class ProposalCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }

    fetchByPubK = (public_key: string) => this.quick().find({ public_key }) 
    pullBySID = (sid: number, page: number) => this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run()

    prepareJSONRendering = () => {
        this.local().forEach((p: ProposalModel) => {
            p.prepareJSONRendering()
        })
    }
}

export default new ProposalCollection([], {table: 'proposals'})