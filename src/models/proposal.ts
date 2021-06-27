import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IVote } from '../routes/interfaces'
import { BuildProposalEmbedString } from '../utils/embed'
import { IAuthor } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'

export class ProposalModel extends Model {
    static schema = Joi.object({

        id: Joi.number().autoIncrement().primaryKey(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        public_key: Joi.string().max(70).hex().required(),
        public_key_hashed: Joi.string().max(64).hex().required(),
        signature: Joi.string().max(200).hex().required(),
        title: Joi.string().max(140).required(),
        content: Joi.string().max(15000).required(),

        index: Joi.number().required(),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author'),
        content_link: Joi.string().required(),
        vote: Joi.string().required(),
        created_at: Joi.date().default('now')
    })

    toEmbed = () => {
        const c_link = this.get().contentLink()
        return BuildProposalEmbedString(this.get().pubKH(), new ScriptEngine(ToArrayBufferFromB64(c_link.link.output.script)).proposalContentTypeString(), this.get().createdAt(), this.get().vote(), this.get().title())
    }

    get = () => {
        return {
            id: () => this.state.id, 
            sid: () => this.state.sid,

            title: (): string => this.state.title,
            content: (): string => this.state.content,
            author: (): IAuthor => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IContentLink => {
                const c = this.copy() as ProposalModel
                c.prepareJSONRendering()
                return this.state.content_link
            },
            vote: (): IVote => {
                const c = this.copy() as ProposalModel
                c.prepareJSONRendering()
                return this.state.vote
            },
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