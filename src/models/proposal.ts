import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IKindLink, IVote } from '../routes/interfaces'
import { BuildProposalPreviewString, IEmbed } from 'involvera-content-embedding'
import { AliasModel, IAuthor } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'
import { T_FETCHING_FILTER } from '../static/types'

export class ProposalModel extends Model {
    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['preview', 'view', 'full']),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author').group(['view', 'full']),

        public_key: Joi.string().max(70).hex().required().group(['full']),
        public_key_hashed: Joi.string().length(40).max(40).hex().required().group(['preview', 'view', 'full']),
        signature: Joi.string().max(200).hex().required().group(['full']),

        index: Joi.number().required().group(['preview', 'view', 'full']),
        title: Joi.string().max(120).required().group(['preview', 'view', 'full']),
        content: Joi.string().max(15000).required().group(['view', 'full']),

        content_link: Joi.string().required().group(['preview', 'view', 'full']),
        vote: Joi.string().required().group(['preview', 'view', 'full']),
        created_at: Joi.date().default('now').group(['preview', 'view', 'full'])
    })

    get = () => {
        return {
            preview: () => {
                const link = this.get().contentLink()
                return BuildProposalPreviewString(this.get().pubKH(), new ScriptEngine(ToArrayBufferFromB64(link.output.script)).proposalContentTypeString(), this.get().createdAt(), this.get().vote(), this.get().title())
            },
            id: () => this.state.id, 
            sid: () => this.state.sid,
            title: (): string => this.state.title,
            content: (): string => this.state.content,
            author: (): AliasModel => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IKindLink => {
                if (typeof this.state.content_link === 'string')
                    return JSON.parse(this.state.content_link)
                return this.state.content_link
            },
            vote: (): IVote => {
                if (typeof this.state.vote == 'string')
                    return JSON.parse(this.state.vote)
                return this.state.vote
            },
        }
    }

    prepareJSONRendering = () => {
        this.setState({
            content_link: this.get().contentLink(),
            vote: this.get().vote(),
            content: this.state.content.split('~~~_~~~_~~~_~~~')
        }, true)
    }

    renderJSON = (filter: T_FETCHING_FILTER) => {
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        json.preview = this.get().preview()
        return json
    }

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}

export class ProposalCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }

    fetchByPubK = async (public_key: string) => await this.quick().find({ public_key }) as ProposalModel
    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 5).limit((page+1) * 5).run() as ProposalCollection

    renderJSON = (filter: T_FETCHING_FILTER) => {
        return this.local().map((p: ProposalModel) => {
            return p.renderJSON(filter)
        })
    }

}

export default new ProposalCollection([], {table: 'proposals'})