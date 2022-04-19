import { Joi, Collection, Model } from 'elzeard'
import {  IHeaderSignature, IKindLinkUnRaw, IThreadReward } from 'community-coin-types'
import { BuildThreadPreviewString, IEmbedTag, IPreview, IProposalPreview, IThreadPreview, ParseEmbedInText } from 'involvera-content-embedding'
import { AliasModel } from './alias'
import Knex from 'knex'
import _ from 'lodash'
import { ScriptEngine } from 'wallet-script'
import { ToArrayBufferFromB64 } from 'wallet-util'
import { IPostEmbed, ICountReply, IPreviewThread } from '../static/interfaces'
import { EmbedCollection, EmbedModel } from './embed'
import axios from 'axios'

import { SocietyModel } from './society'
import { ProposalModel } from './proposal'
import { thread, embed, proposal, cachedSocieties } from '.'

export class ThreadModel extends Model {

    static FetchRewards = async (pubkhs: string, society: SocietyModel, headerSig: IHeaderSignature | void) => {
        try {
            const res = await axios.get(society.get().currencyRouteAPI() + '/threads/rewards',{
                headers: Object.assign({ list: pubkhs }, headerSig || {}),
                validateStatus: function (status) {
                    return status >= 200 && status <= 500
                }
            })
            if (res.status == 200)
                return res.data as IThreadReward[]
        } catch(e){
            throw new Error(e)
        }
    }

    static RenderTargetAndSubTarget = async (target: ThreadModel | ProposalModel | null) => {
        let json: any = {}
        if (target){
            target instanceof ThreadModel && target.prepareJSONRendering()
            json.target = target instanceof ThreadModel ? target.to().filterGroup('view').plain() : target.get().preview().unzipped()
            if (target instanceof ThreadModel){
                const target2 = await target.get().target()
                if (target2) {
                    target2 instanceof ThreadModel && target2.prepareJSONRendering()
                    json.target.target = target2 instanceof ThreadModel ? target2.to().filterGroup('view').plain() : target2.get().preview().unzipped()
                }
            }
        }
        return json
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
        target_pkh: Joi.string().min(0).max(40).hex().default(''),
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

    getRewards = async (society: SocietyModel, headerSig: IHeaderSignature | void) => ThreadModel.FetchRewards(this.get().pubKH(), society, headerSig)

    get = () => {

        const preview = (target: ProposalModel | ThreadModel | null) => {

            const unzipped = (): IThreadPreview => {
                let t: IThreadPreview | IProposalPreview | null = null
                if (target instanceof ProposalModel){
                    t = target.get().preview().unzipped()
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
                return !!e ? e.get().content() : null
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
            targetPKH: (): string => this.state.target_pkh,
            target: async (): Promise<ThreadModel | ProposalModel | null> => {
                const link = this.get().contentLink()
                const script = new ScriptEngine(ToArrayBufferFromB64(link.output.script))
                if (script.is().rethreadScript()){
                    const contentPKH = script.parse().targetPKHFromContentScript().toString('hex')
                    const p = await proposal.fetchByPubKH(this.get().sid(), contentPKH)
                    if (p){
                        await p.pullOnChainData(cachedSocieties.local().find({ id: this.get().sid() }) as SocietyModel)
                        return p
                    }
                    const t = await thread.fetchByPubKH(this.get().sid(), contentPKH)
                    if (t)
                        return t
                }
                return null
            },
            countReply: async () => this.sql().count().where({sid: this.get().sid(), target_pkh: this.get().pubKH()})
        }
    }

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderReplyJSON = async (society: SocietyModel, headerSig: IHeaderSignature | void)  => {
        return this.renderViewJSON(society, headerSig, true)
    }

    renderViewJSON = async (society: SocietyModel, headerSig: IHeaderSignature | void, isReply: boolean | void)  => {
        const p = await Promise.all([
            this.get().contentEmbeds(),
            this.getRewards(society, headerSig),
            this.get().countReply(),
            !isReply ? this.get().target() : null
        ])
        this.prepareJSONRendering()
        
        let target: any ={}
        if (!isReply)
            target = await ThreadModel.RenderTargetAndSubTarget(p[3])

        return {
            ...this.to().filterGroup('view').plain(),
            ...target,
            embeds: p[0],
            reward: p[1][0],
            reply_count: p[2],
        }
    }
}

export class ThreadCollection extends Collection {
   
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    get = () => {

        const rewardList = (society: SocietyModel, headerSig: IHeaderSignature | void) => {
            const listPKHStr = this.local().map((t: ThreadModel) => t.get().pubKH()).join(',')
            return ThreadModel.FetchRewards(listPKHStr, society, headerSig)
        }

        const countReplyList = async (society: SocietyModel) => {
            const res = await this.sql().knex().select('target_pkh').table(this.sql().table().name()).where({sid: society.get().ID()}).whereIn('target_pkh', this.local().map((t: ThreadModel) => t.get().pubKH())).groupBy('target_pkh').count('* as count')
            const ret: ICountReply[] = []
            for (let o of res)
                ret.push({target_pkh: o.target_pkh, count: o.count})
            return ret
        }

        const embedList = (society: SocietyModel) => {
            const content = this.local().map((t: ThreadModel) => t.get().content()).join(' ')
            return EmbedCollection.FetchEmbeds(content, society.get().ID())
        }

        return {
            rewardList, countReplyList, embedList
        }

    }
    
    fetchByPubKH = async (sid: number, public_key_hashed: string) => await this.quick().find({ sid, public_key_hashed }) as ThreadModel
    
    pullBySID = async (sid: number, page: number, nPerPage: number) => await this.ctx().sql().pull().where({sid}).orderBy('id', 'desc').offset(page * nPerPage).limit((page+1) * nPerPage).run() as ThreadCollection    
    pullBySIDAndTargetPKH = async (sid: number, target_pkh: string, page: number, nPerPage: number) => await this.ctx().sql().pull().where({sid, target_pkh}).orderBy('id', 'desc').offset(page * nPerPage).limit((page+1) * nPerPage).run() as ThreadCollection
    pullBySIDAndTargetPKHSortedAsc = async (sid: number, target_pkh: string, page: number, nPerPage: number) => await this.ctx().sql().pull().where({sid, target_pkh}).orderBy('id', 'asc').offset(page * nPerPage).limit((page+1) * nPerPage).run() as ThreadCollection    

    //thread full format without targets.
    renderThreadRepliesJSON = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        const p = await Promise.all([
            this.get().embedList(society),
            this.get().rewardList(society, headerSig),
            this.get().countReplyList(society),
        ])

        const listEmbeds = p[0]
        return this.local().map((t: ThreadModel, index: number) => {
            const es = ParseEmbedInText(t.get().content())
            const embeds = this.copy().local().set(es.map((e: IEmbedTag) => {
                if (!e.society)
                    e.society = society.get().pathName()
                const sid = (cachedSocieties.local().find({path_name: e.society}) as SocietyModel).get().ID()
                if (e.type == 'PROPOSAL'){
                    return listEmbeds.local().find((emb: EmbedModel) => {
                        return e.index == emb.get().index() && emb.get().sid() === sid
                    }).to().plain()
                }
                if (e.type == 'THREAD'){
                    return listEmbeds.local().find((emb: EmbedModel) => {
                        return e.pkh == emb.get().pubKH() && emb.get().sid() === sid
                    }).to().plain()
                }
            })).to().filterGroup('preview').plain().map((c: any) => c.content) as string[]

            t.prepareJSONRendering()
            const json = t.to().filterGroup('view').plain()
            const reward = _.find(p[1], {thread_pkh: t.get().pubKH()})
            if (!reward)
                throw new Error("Unable to fetch thread's rewards")
            const replyCount = _.find(p[2], {target_pkh: t.get().pubKH()})            
            return {
                ...json, 
                embeds,
                reward,
                reply_count: replyCount ? replyCount.count : 0
            }
        }) 
    }

    renderPreviewList = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        const p = await Promise.all([
            this.get().rewardList(society, headerSig),
            embed.pullBySidsAndPKHs(this.local().map((t: ThreadModel) => t.get().sid()), this.local().map((t: ThreadModel) => t.get().pubKH())),
            this.get().countReplyList(society)
        ])
        
        const listRewards = p[0]
        const listEmbeds = p[1]
        const listCountReplies = p[2]
        listEmbeds.local().removeBy({type: 'PROPOSAL'})

        return this.local().map((t: ThreadModel) => {
            const reward = _.find(listRewards, {thread_pkh: t.get().pubKH()})
            if (!reward)
                throw new Error("Unable to fetch thread's rewards")

            const embed = listEmbeds.local().find({ public_key_hashed: t.get().pubKH() }) as EmbedModel
            if (!embed)
                throw new Error("Unable to fetch thread's embed")

            const replyCount = _.find(listCountReplies, { target_pkh: t.get().pubKH() })

            return {
                reward, 
                preview_code: embed.get().content(), 
                content_link: t.get().contentLink(), 
                reply_count: replyCount ? replyCount.count : 0
            }
        })
    }
}

export default new ThreadCollection([], {table: 'threads'})