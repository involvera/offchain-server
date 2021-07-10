import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IKindLink } from '../routes/interfaces'
import { BuildThreadPreviewString } from 'involvera-content-embedding'
import { AliasModel, IAuthor } from './alias'
import { T_FETCHING_FILTER } from '../static/types'


export class ThreadModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['preview', 'view', 'full']),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author').group(['preview', 'view', 'full']),

        public_key: Joi.string().max(70).hex().required().group(['full']),
        public_key_hashed: Joi.string().length(40).max(40).hex().required().group(['preview', 'view', 'full']),
        signature: Joi.string().max(200).hex().required().group(['full']),

        title: Joi.string().min(0).max(140).group(['preview', 'view', 'full']),
        content: Joi.string().min(20).max(5000).required().group(['view', 'full']),

        content_link: Joi.string().required().group(['preview', 'view', 'full']),
        created_at: Joi.date().default('now').group(['preview', 'view', 'full']),
    })

    constructor(initialState: any, options: any){
        super(initialState, ThreadModel, options)
    }

    get = () => {
        return {
            preview: () => {
                const link = this.get().contentLink()
                return BuildThreadPreviewString(this.get().pubKH(), this.get().author().to().plain(), this.get().createdAt(), !link.target_content ? null : link.target_content, this.get().title(), this.get().content())
            },
            title: (): string => this.state.title,
            content: (): string => this.state.content,
            author: (): AliasModel => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            id: (): number => this.state.id,
            sid: (): number => this.state.sid,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IKindLink => {
                if (typeof this.state.content_link == 'string')
                    return JSON.parse(this.state.content_link)
                return this.state.content_link
            },
        }
    }

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderJSON = (filter: T_FETCHING_FILTER)  => {
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        json.preview = this.get().preview()
        return json
    }
}

export class ThreadCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    fetchByPubK = async (public_key: string) => await this.quick().find({ public_key }) as ThreadModel
    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection

    renderJSON = (filter: T_FETCHING_FILTER): any => {
        return this.local().map((t: ThreadModel) => {
            return t.renderJSON(filter)
        })
    }


}

export default new ThreadCollection([], {table: 'threads'})