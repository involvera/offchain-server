import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IKindLink, IVote } from '../routes/interfaces'
import { BuildProposalPreviewString, IEmbed } from '../utils/embed'
import { AliasModel, IAuthor } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'

export class ProposalModel extends Model {
    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author'),

        public_key: Joi.string().max(70).hex().required(),
        public_key_hashed: Joi.string().length(40).max(40).hex().required(),
        signature: Joi.string().max(200).hex().required(),

        index: Joi.number().required(),
        title: Joi.string().max(140).required(),
        content: Joi.string().max(15000).required(),

        content_link: Joi.string().required(),
        vote: Joi.string().required(),
        created_at: Joi.date().default('now')
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

    renderJSON = () => {
        this.prepareJSONRendering()
        const json = this.to().filterGroup('author').plain()
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
    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run() as ProposalCollection

    renderJSON = () => {
        return this.local().map((p: ProposalModel) => {
            return p.renderJSON()
        })
    }

}

export default new ProposalCollection([], {table: 'proposals'})