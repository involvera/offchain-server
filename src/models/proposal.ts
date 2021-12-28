import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import { IContentLink, IKindLink, IVote } from '../routes/interfaces'
import { BuildProposalPreviewString} from 'involvera-content-embedding'
import { AliasModel } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'
import { T_FETCHING_FILTER } from '../static/types'
import Knex from 'knex'
import { EmbedCollection } from './embed'
import { SocietyModel } from './society'
import fetch from 'node-fetch'

export class ProposalModel extends Model {

    private _onChainData: IContentLink | null = null

    static fetchOnChainData = async (society: SocietyModel, pubkhHex: string): Promise<string | IContentLink> => {
        try {
            const response = await fetch(society.get().currencyRouteAPI() + '/proposal/' + pubkhHex)
            return response.status === 200 ? await response.json() : await response.text()
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
        title: Joi.string().max(120).required().group(['preview', 'view', 'full']),
        content: Joi.string().max(15000).required().group(['view', 'full']),

        created_at: Joi.date().default('now').group(['preview', 'view', 'full']),
    })

    setOnChainData = (json: IContentLink) => {
        this._onChainData = {
            link: json.link,
            index: json.index,
            vote: json.vote,
            pubkh_origin: json.pubkh_origin
        }
    }

    getOnChainData = (): IContentLink | null => this._onChainData

    toEmbedData = () => {
        return {
            public_key_hashed: null as string,
            index: this.get().index(),
            type: "proposal",
            content: this.get().preview().embed_code,
            sid: this.get().sid()
        }
    }
    
    pullOnChainData = async (society: SocietyModel) => {
        try {
            const json = await ProposalModel.fetchOnChainData(society, this.get().pubKH())
            !!json && typeof json !== 'string' && this.setOnChainData(json)
            if (!!json && typeof json === 'string')
                throw new Error(json)
        } catch (e){
            throw new Error(e)
        }
    }

    get = () => {
        return {
            preview: () => {
                const link = this.get().contentLink()
                return BuildProposalPreviewString(this.get().index(), new ScriptEngine(ToArrayBufferFromB64(link.output.script)).proposalContentTypeString(), this.get().createdAt(), this.get().vote(), this.get().title(), this.get().sid())
            },
            embeds: async () => {
                const list = await EmbedCollection.FetchEmbeds(this)
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
            contentLink: (): IKindLink => this._onChainData == null ? undefined : this._onChainData.link,
            vote: (): IVote => this._onChainData == null ? undefined : this._onChainData.vote,
        }
    }

    prepareJSONRendering = () => {
        this.setState({
            content_link: this.get().contentLink(),
            vote: this.get().vote(),
            content: this.state.content.split('~~~_~~~_~~~_~~~')
        }, true)
    }

    renderJSON = async (filter: T_FETCHING_FILTER, society: SocietyModel | null) => {
        let embeds: string[] = []
        if (filter != 'preview')
            embeds = await this.get().embeds()
        if (society)
            await this.pullOnChainData(society)
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        json.embeds = embeds
        return Object.assign(json, {
            content_link: this.state.content_link,
            vote: this.get().vote(),
            pubkh_origin: this.getOnChainData().pubkh_origin
        })
    }

    constructor(initialState: any, options: any){
        super(initialState, ProposalModel, options)
    }
}

export class ProposalCollection extends Collection {

    static fetchOnChainData = async (society: SocietyModel, pubKHList: string): Promise<IContentLink[] | string> => {
        try {
            const response = await fetch(society.get().currencyRouteAPI() + '/proposals', {
                headers: { list: pubKHList }
            })
            return response.status == 200 ? await response.json() : await response.text()
        } catch (e){
            throw new Error(e)
        }
    }

    constructor(initialState: any, options: any){
        super(initialState, [ProposalModel, ProposalCollection], options)
    }

    fetchByPubK = async (public_key: string) => await this.quick().find({ public_key }) as ProposalModel
    fetchByIndex = async (sid: number, index: number) => await this.quick().find({sid, index}) as ProposalModel

    pullByPubKHs = async (pubkhs: string[]) => await this.ctx().sql().pull().whereIn('public_key_hashed', pubkhs).run()

    pullByIndexes = async (sid: number, indexes: number[]) => {
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
            return q.where({sid}).whereIn('index', indexes)
        }) as ProposalCollection
    }

    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 5).limit((page+1) * 5).run() as ProposalCollection

    renderJSON = async (filter: T_FETCHING_FILTER, society: SocietyModel) => {
        society && await this.pullOnChainData(society)
        return Promise.all(this.local().map(async (p: ProposalModel) => {
            return await p.renderJSON(filter, null)
        }))
    }

    pullOnChainData = async (society: SocietyModel) => {
        try {
            const list = this.local().map((p: ProposalModel) => p.get().pubKH()).join(',')
            const l = await ProposalCollection.fetchOnChainData(society, list)
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