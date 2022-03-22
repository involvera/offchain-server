import { Joi, Collection, Model } from 'elzeard'
import {  IKindLinkUnRaw, IReactionCount } from 'community-coin-types'
import { BuildThreadPreviewString, IPreview, IProposalPreview, IThreadPreview } from 'involvera-content-embedding'
import { AliasModel } from './alias'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'
import { T_FETCHING_FILTER } from '../static/types'
import Knex from 'knex'
import { EmbedCollection, IPostEmbed } from './embed'
import axios from 'axios'

import { SocietyModel } from './society'
import proposal, { ProposalModel } from './proposal'
import { thread, embed } from '.'

export class ThreadModel extends Model {

    static FetchRewards = async (pubkhs: string, society: SocietyModel) => {
        try {
            const res = await axios.get(society.get().currencyRouteAPI() + '/threads/rewards',{
                headers: { list: pubkhs },
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            if (res.status == 200)
                return res.data as IReactionCount[]
        } catch(e){
            throw new Error(e)
        }
    }

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['view', 'full']),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author').group(['view', 'full']),

        lugh_height: Joi.number().positive().integer().max(2_000_000_000).required().group(['full']),
        public_key: Joi.string().max(70).hex().required().group(['full']),
        public_key_hashed: Joi.string().length(40).max(40).hex().required().group(['view', 'full']),
        signature: Joi.string().max(200).hex().required().group(['full']),

        title: Joi.string().min(0).max(100).default('').group(['view', 'full']),
        content: Joi.string().min(0).max(5000).default('').group(['view', 'full']),

        content_link: Joi.string().required().group(['view', 'full']),
        created_at: Joi.date().default('now').group(['view', 'full']),
    })

    constructor(initialState: any, options: any){
        super(initialState, ThreadModel, options)
    }

    toEmbedData = (target: ProposalModel | ThreadModel | null): IPostEmbed => {
        return {
            public_key_hashed: this.get().pubKH(),
            index: -1,
            type: "THREAD",
            content: this.get().preview(target).zipped().embed_code,
            sid: this.get().sid()
        }
    }

    getRewards = async (society: SocietyModel) => ThreadModel.FetchRewards(this.get().pubKH(), society)

    get = () => {

        const preview = (target: ProposalModel | ThreadModel | null) => {

            const unzipped = (): IThreadPreview => {
                let t: IThreadPreview | IProposalPreview | null = null
                if (target instanceof ProposalModel){
                    t = null
                } else if (target instanceof ThreadModel){
                    t = target.get().preview(null).unzipped()
                }
                return {
                    pkh: this.get().pubKH(),
                    author: this.get().author().to().filterGroup('author').plain(),
                    created_at: this.get().createdAt(),
                    sid: this.get().sid(),
                    title: this.get().title(),
                    content: this.get().content(),
                    target: t
                }
            }

            const zipped = (): IPreview => BuildThreadPreviewString(unzipped())
            
            return { unzipped, zipped }
        }

        return {
            preview,
            contentEmbeds: async () => {
                const list = await EmbedCollection.FetchEmbeds(this.get().content(), this.get().sid())
                return list.local().to().filterGroup('preview').plain().map((c: any) => c.content) as string[]
            },
            embedString: async () => {
                const e = await embed.fetchByPKH(this.get().id(), this.get().pubKH(), 'THREAD')
                if (e)
                    return e.get().content()
                return null
            },      
            title: (): string => this.state.title,
            content: (): string => this.state.content,
            author: (): AliasModel => this.state.author,
            pubKH: (): string => this.state.public_key_hashed,
            id: (): number => this.state.id,
            sid: (): number => this.state.sid,
            createdAt: (): Date => this.state.created_at,
            contentLink: (): IKindLinkUnRaw => {
                if (typeof this.state.content_link == 'string')
                    return JSON.parse(this.state.content_link)
                return this.state.content_link
            },
            target: async (): Promise<ThreadModel | ProposalModel | null> => {
                const link = this.get().contentLink()
                const script = new ScriptEngine(ToArrayBufferFromB64(link.output.script))
                if (script.is().rethreadScript()){
                    const contentPKH = script.parse().targetPKHFromContentScript().toString('hex')
                    const p = await proposal.fetchByPubKH(this.get().sid(), contentPKH)
                    if (p)
                        return p
                    const t = await thread.fetchByPubKH(this.get().sid(), contentPKH)
                    if (t)
                        return t
                }
                return null
            }
        }
    }

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderJSON = async (filter: T_FETCHING_FILTER, society: SocietyModel | null)  => {
        let embeds: string[] = []
        if (filter != 'preview')
            embeds = await this.get().contentEmbeds()
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        if (filter == 'preview'){
            json.preview = await this.get().embedString()
        }
        if (society != null){
            json.rewards = (await this.getRewards(society))[0]
            
        }
        json.embeds = embeds
        return json
    }
}

export class ThreadCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    fetchRewards = async (society: SocietyModel) => ThreadModel.FetchRewards(this.local().map((t: ThreadModel) => t.get().pubKH()).join(','), society)

    fetchByPubK = async (public_key: string) => await this.quick().find({ public_key }) as ThreadModel
    fetchByPubKH = async (sid: number, public_key_hashed: string) => await this.quick().find({ sid, public_key_hashed }) as ThreadModel
 
    pullBySID = async (sid: number, page: number) => await this.ctx().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection    
    pullByPubKHs = async (sid: number, pubkhs: string[]) => {
        return await this.ctx().sql().pull().custom((q: Knex.QueryBuilder): any => {
            return q.where({sid}).whereIn('public_key_hashed', pubkhs)
        }) as ThreadCollection
    }
    
    //Improve this method to execute only ONE getRewards request to pull all the rewards count at once.
    renderJSON = async (filter: T_FETCHING_FILTER, society:SocietyModel) => {
        const list = await this.fetchRewards(society)
        let i = 0;
        return Promise.all(this.local().map(async (t: ThreadModel) => {
            const a = Object.assign({}, await t.renderJSON(filter, null), list[i])
            i++
            return a
        }))
    }
}

export default new ThreadCollection([], {table: 'threads'})