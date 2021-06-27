import { Joi, Collection, Model } from 'elzeard'
import { IContentLink } from '../routes/interfaces'
import { BuildThreadEmbedString } from '../utils/embed'
import { IAuthor } from './alias'

export class ThreadModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),

        public_key: Joi.string().max(70).hex().required(),
        public_key_hashed: Joi.string().max(64).hex().required(),
        signature: Joi.string().max(200).hex().required(),

        title: Joi.string().min(0).max(140),
        content: Joi.string().min(20).max(5000).required(),

        first_embed: Joi.string().max(1000),

        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author'),
        content_link: Joi.string().required(),
        created_at: Joi.date().default('now')
    })

    constructor(initialState: any, options: any){
        super(initialState, ThreadModel, options)
    }

    toEmbed = () => {
        const c_link = this.get().contentLink()
        return BuildThreadEmbedString(this.get().pubKH(), JSON.stringify(this.get().author()), this.get().createdAt(), !c_link.link.target_content ? null : c_link.link.target_content, this.get().title(), this.get().content())
    }

    get = () => {
        return {
            title: (): string => this.state.title,
            content: (): string => this.state.content,
            author: (): IAuthor => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            id: (): number => this.state.id,
            sid: (): number => this.state.sid,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IContentLink => {
                const c = this.copy() as ThreadModel
                c.prepareJSONRendering()
                return this.state.content_link
            },
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