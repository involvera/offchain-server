import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import { OFFCHAIN, ONCHAIN  } from 'community-coin-types'
import { BuildProposalPreviewString } from '../utils/embeds'
import { AliasModel } from './alias'
import { Script } from 'wallet-script'
import { TProposalType } from 'wallet-script/dist/src/content-code'
import { EmbedModel } from './embed'
import { SocietyModel } from './society'
import axios from 'axios'
import { IPostEmbed } from '../static/interfaces'
import { cachedSocieties, embed } from '.'
import { Inv } from 'wallet-util'

export class ProposalModel extends Model {

    private _onChainData: ONCHAIN.IProposalLink | null = null

    static fetchOnChainData = async (society: SocietyModel, pubKH: Inv.PubKH, headerSig: ONCHAIN.IHeaderSignature | void) => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposal/' + pubKH.hex(), {
                headers: headerSig as any || {},
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status === 200 ? response.data as ONCHAIN.IProposalLink : response.data as string
        } catch (e){
            throw new Error(e)
        }
    }

    static fetchProposalContext = async(society: SocietyModel, pubKH: Inv.PubKH) => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposal/' + pubKH.hex() + '/context', {
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status === 200 ? response.data as ONCHAIN.IProposalContext : response.data as string
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

    setOnChainData = (json: ONCHAIN.IProposalLink) => {
        this._onChainData = {
            link: json.link,
            index: json.index,
            vote: json.vote,
            pubkh_origin: json.pubkh_origin,
            rewards: null,
            user_vote: json.user_vote || null
        }
    }

    getOnChainData = (): ONCHAIN.IProposalLink | null => this._onChainData

    toEmbedData = (): IPostEmbed => {
        const s = cachedSocieties.findByID(this.get().sid())
        return {
            public_key_hashed: this.get().pubKH().hex(),
            index: this.get().index(),
            type: 'PROPOSAL',
            content: this.get().preview().zipped().embed_code,
            sid: this.get().sid(),
            spname: s.get().pathName()
        }
    }
    
    pullOnChainData = async (society: SocietyModel, headerSig: ONCHAIN.IHeaderSignature | void) => {
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

            const unzipped = (): OFFCHAIN.IPreviewProposal2 => {
                const link = this.get().contentLink()
                const s = cachedSocieties.findByID(this.get().sid())
                return {
                    index: this.get().index(),
                    author: this.get().author().to().filterGroup('author').plain(),
                    layer: Script.fromBase64(link.output.script).typeD2() as TProposalType,
                    created_at: this.get().createdAt(),
                    vote: this.get().vote(),
                    title: this.get().title(),
                    sid: this.get().sid(),
                    spname: s.get().pathName()
                }
            }

            const zipped = () => BuildProposalPreviewString(unzipped())
            
            return { unzipped, zipped }
        }

        return {
            preview,
            id: (): number => this.state.id, 
            sid: (): number => this.state.sid,
            title: (): string => this.state.title,
            index: (): number => this.state.index,
            content: (): string | string[] => this.state.content,
            author: (): AliasModel => this.state.author,
            pubKH: (): Inv.PubKH => Inv.PubKH.fromHex(this.state.public_key_hashed),
            createdAt: (): Date => this.state.created_at,
            contentLink: () => this._onChainData == null ? undefined : this._onChainData.link,
            vote: () => this._onChainData == null ? undefined : this._onChainData.vote,
            context: (): string => this.state.context
        }
    }

    prepareJSONRendering = () => {
        this.setState({
            content_link: this.get().contentLink(),
            vote: this.get().vote(),
            content: this.state.content.split('~~~_~~~_~~~_~~~')
        }, true)
    }

    renderViewJSON = async (society: SocietyModel | null, headerSig: ONCHAIN.IHeaderSignature | void): Promise<OFFCHAIN.IProposal> => {
        society && await this.pullOnChainData(society, headerSig)
        this.prepareJSONRendering()
        return {
            sid: this.get().sid(),
            index: this.get().index(),
            created_at: this.get().createdAt(),
            title: this.get().title(),
            content: this.get().content() as string[],
            context: this.get().context(),
            author: this.get().author().to().filterGroup('author').plain(),
            public_key_hashed: this.get().pubKH().hex(),
            content_link: this.get().contentLink(),
            vote: this.get().vote(),
            pubkh_origin: this.getOnChainData().pubkh_origin,
            user_vote: this.getOnChainData().user_vote
        }
    }

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}


export class ProposalCollection extends Collection {

    static fetchOnChainData = async (society: SocietyModel, pubKHList: string, headerSig: ONCHAIN.IHeaderSignature | void) => {
        try {
            const response = await axios.get(society.get().currencyRouteAPI() + '/proposals', {
                headers: Object.assign({ list: pubKHList }, headerSig || {}),
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            return response.status == 200 ? response.data as ONCHAIN.IProposalLink[] : response.data as string
        } catch (e){
            throw new Error(e)
        }
    }

    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }

    sortByIndexDesc = () => this.local().orderBy('index', 'desc') as ProposalCollection 

    fetchByIndex = async (sid: number, index: number) => await this.quick().find({sid, index}) as ProposalModel
    fetchByPubKH = async (sid: number, pubkh: Inv.PubKH) => await this.quick().find({public_key_hashed: pubkh.hex(), sid}) as ProposalModel

    pullLastsBySID = async (sid: number, offset: number) => await this.copy().sql().pull().where({sid}).orderBy('index', 'desc').offset(offset).limit(5).run() as ProposalCollection

    renderPreviewJSON = async (society: SocietyModel, headerSig: ONCHAIN.IHeaderSignature | void) => {
        const p = await Promise.all([
            embed.pullBySidsAndIndexes(this.local().map((p: ProposalModel) => p.get().sid()), this.local().map((p: ProposalModel) => p.get().index())),
            society ? await this.pullOnChainData(society, headerSig) : null
        ])
        const listEmbeds = p[0]

        return this.local().map((p: ProposalModel) => {
            const { user_vote, vote } = p.getOnChainData()
            const embed = listEmbeds.local().find({ index: p.get().index() }) as EmbedModel
            if (!embed)
                throw new Error("Unable to fetch thread's embed")
            const ret: OFFCHAIN.IPreviewProposal1 = {
                preview_code: embed.get().content(),
                user_vote,
                vote,
            }
            return ret
        }) as OFFCHAIN.IPreviewProposal1[]
    }

    pullOnChainData = async (society: SocietyModel, headerSig: ONCHAIN.IHeaderSignature | void) => {
        try {
            const list = this.local().map((p: ProposalModel) => p.get().pubKH().hex()).join(',')
            const res = await ProposalCollection.fetchOnChainData(society, list, headerSig)
            if (typeof res == 'string')
                throw new Error(res)
            res.forEach((link, index) => {
                (this.local().nodeAt(index) as ProposalModel).setOnChainData(link)
            })
        } catch (e){
            throw new Error(e)
        }
    }
}

export default new ProposalCollection([], {table: 'proposals'})