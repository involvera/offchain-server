import { Joi, Collection, Model } from 'elzeard'

export class ThreadModel extends Model {

    static schema = Joi.object({
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),

        public_key: Joi.string().max(70).hex().required(),
        signature: Joi.string().max(200).hex().required(),

        title: Joi.string().min(0).max(140),
        content: Joi.string().min(20).max(5000).required(),

        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author'),
        content_link: Joi.string().required(),
        created_at: Joi.date().default('now')
    })

    constructor(initialState: any, options: any){
        super(initialState, ThreadModel, options)
    }

    get = () => {
        return {
            sid: () => this.state.sid,
        }
    }
    prepareJSONRendering = () => {
        this.setState({ content_link: JSON.parse(this.state.content_link) }, true)
    }
}

export class ThreadCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    fetchByPubK = (public_key: string) => this.quick().find({ public_key }) 
    
}

export default new ThreadCollection([], {table: 'threads'})