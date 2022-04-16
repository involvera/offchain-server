import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IKindLinkUnRaw, IVoteSummary, IProposalContext } from 'community-coin-types'
import { BuildProposalPreviewString, IPreview, IProposalPreview} from 'involvera-content-embedding'
import { AliasModel } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'
import { EmbedCollection, EmbedModel } from './embed'
import { SocietyModel } from './society'
import axios from 'axios'
import { IHeaderSignature, IPreviewProposal, IPostEmbed } from '../static/interfaces'
import { embed } from '.'

export class ProposalModel extends Model {

    private _onChainData: IContentLink | null = null

    static fetchOnChainData = async (society: SocietyModel, pubkhHex: string, headerSig: IHeaderSignature | void): Promise<string | IContentLink> => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposal/' + pubkhHex, {
                headers: headerSig as any || {},
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status === 200 ? response.data as IContentLink : response.data as string
        } catch (e){
            throw new Error(e)
        }
    }

    static fetchProposalContext = async(society: SocietyModel, pubkhHex: string): Promise<string | IProposalContext> => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposal/' + pubkhHex + '/context', {
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status === 200 ? response.data as IProposalContext : response.data as string
        } catch (e){
            throw new Error(e)
        }
    }

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['preview', 'view', 'full']),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author').group(['preview', 'view', 'full']),

        public_key: Joi.string().max(70).hex().required().group(['full']),
        public_key_hashed: Joi.string().length(40).max(40).hex().required().group(['preview', 'view', 'full']),
        signature: Joi.string().max(200).hex().required().group(['full']),

        index: Joi.number().required().group(['preview', 'view', 'full']),
        title: Joi.string().max(100).min(10).required().group(['preview', 'view', 'full']),
        content: Joi.string().required().group(['view', 'full']),

        created_at: Joi.date().default('now').group(['preview', 'view', 'full']),
        context: Joi.string().max(15_000).group(['view', 'full'])
    })

    setOnChainData = (json: IContentLink) => {
        this._onChainData = {
            link: json.link,
            index: json.index,
            vote: json.vote,
            pubkh_origin: json.pubkh_origin,
            rewards: null,
            user_vote: json.user_vote || null as any
        }
    }

    getOnChainData = (): IContentLink | null => this._onChainData

    toEmbedData = (): IPostEmbed => {
        return {
            public_key_hashed: this.get().pubKH(),
            index: this.get().index(),
            type: 'PROPOSAL',
            content: this.get().preview().zipped().embed_code,
            sid: this.get().sid()
        }
    }
    
    pullOnChainData = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        try {
            const json = await ProposalModel.fetchOnChainData(society, this.get().pubKH(), headerSig)
            !!json && typeof json !== 'string' && this.setOnChainData(json)
            if (!!json && typeof json === 'string')
                throw new Error(json)
        } catch (e){
            throw new Error(e)
        }
    }

    get = () => {

        const preview = () => {

            const unzipped = (): IProposalPreview => {
                const link = this.get().contentLink()
                return {
                    index: this.get().index(),
                    author: this.get().author().to().filterGroup('author').plain(),
                    layer: new ScriptEngine(ToArrayBufferFromB64(link.output.script)).proposalContentTypeString(),
                    created_at: this.get().createdAt(),
                    vote: this.get().vote(),
                    title: this.get().title(),
                    sid: this.get().sid()
                }
            }

            const zipped = (): IPreview => BuildProposalPreviewString(unzipped())
            
            return { unzipped, zipped }
        }

        return {
            preview,
            embeds: async () => {
                const list = await EmbedCollection.FetchEmbeds(this.get().content(), this.get().sid())
                return list.local().to().filterGroup('preview').plain().map((c: any) => c.content) as string[]
            },
            id: (): number => this.state.id, 
            sid: (): number => this.state.sid,
            title: (): string => this.state.title,
            index: (): number => this.state.index,
            content: (): string => this.state.content,
            author: (): AliasModel => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IKindLinkUnRaw => this._onChainData == null ? undefined : this._onChainData.link,
            vote: (): IVoteSummary => this._onChainData == null ? undefined : this._onChainData.vote,
        }
    }

    prepareJSONRendering = () => {
        this.setState({
            content_link: this.get().contentLink(),
            vote: this.get().vote(),
            content: this.state.content.split('~~~_~~~_~~~_~~~')
        }, true)
    }

    renderView = async (society: SocietyModel | null, headerSig: IHeaderSignature | void) => {
        const p = await Promise.all([
            this.get().embeds(),
            society ? this.pullOnChainData(society, headerSig) : null
        ])

        this.prepareJSONRendering()
        const json = this.to().filterGroup('view').plain()
        json.embeds = p[0]

        return Object.assign(json, {
            content_link: this.state.content_link,
            vote: this.get().vote(),
            pubkh_origin: this.getOnChainData().pubkh_origin,
            user_vote: this.getOnChainData().user_vote
        })
    }

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}

export class ProposalCollection extends Collection {

    static fetchOnChainData = async (society: SocietyModel, pubKHList: string, headerSig: IHeaderSignature | void): Promise<IContentLink[] | string> => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposals', {
                headers: Object.assign({ list: pubKHList }, headerSig || {}),
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status == 200 ? response.data as IContentLink[] : response.data as string
        } catch (e){
            throw new Error(e)
        }
    }

    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }

    sortByIndexDesc = () => this.local().orderBy('index', 'desc') as ProposalCollection 

    fetchByIndex = async (sid: number, index: number) => await this.quick().find({sid, index}) as ProposalModel
    fetchByPubKH = async (sid: number, public_key_hashed: string) => await this.quick().find({public_key_hashed, sid}) as ProposalModel

    pullLastsBySID = async (sid: number, offset: number) => await this.copy().sql().pull().where({sid}).orderBy('index', 'desc').offset(offset).limit(5).run() as ProposalCollection

    renderPreview = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        society && await this.pullOnChainData(society, headerSig)
        const listEmbeds = await embed.pullBySidsAndIndexes(this.local().map((p: ProposalModel) => p.get().sid()), this.local().map((p: ProposalModel) => p.get().index()))

        const ret: IPreviewProposal[] = []
        for (let i = 0; i < this.local().count(); i++){
            const p = this.local().nodeAt(i) as ProposalModel
            const { user_vote, vote } = p.getOnChainData()
            ret.push({user_vote, vote, preview_code: ''})
            const e = listEmbeds.local().find({ index: (this.local().nodeAt(i) as ProposalModel).get().index() }) as EmbedModel
            if (e){
                ret[i].preview_code = e.get().content()
            }
        }

        return ret
    }

    pullOnChainData = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        try {
            const list = this.local().map((p: ProposalModel) => p.get().pubKH()).join(',')
            const l = await ProposalCollection.fetchOnChainData(society, list, headerSig)
            if (typeof l == 'string'){
                throw new Error(l)
            }
            let i = 0;
            for (const e of l){
                (this.local().nodeAt(i) as ProposalModel).setOnChainData(e)
                i++
            }
        } catch (e){
            throw new Error(e)
        }
    }
}

export default new ProposalCollection([], {table: 'proposals'})