import { Joi, Collection, Model } from 'elzeard'
import {  IHeaderSignature, IKindLinkUnRaw, IThreadReward } from 'community-coin-types'
import { BuildThreadPreviewString, IPreview, IProposalPreview, IThreadPreview } from 'involvera-content-embedding'
import { AliasModel } from './alias'
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
                    if (p){
                        await p.pullOnChainData(cachedSocieties.local().find({ id: this.get().sid() }) as SocietyModel)
                        return p
                    }
                    const t = await thread.fetchByPubKH(this.get().sid(), contentPKH)
                    if (t)
                        return t
                }
                return null
            }
        }
    }

    fetchCountReply = async () => this.sql().count().where({sid: this.get().sid(), target_pkh: this.get().pubKH()})

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderView = async (society: SocietyModel, headerSig: IHeaderSignature | void)  => {
        const p = await Promise.all([
            this.get().contentEmbeds(),
            this.getRewards(society, headerSig),
            this.fetchCountReply(),
            this.get().target()
        ])
        const embeds = p[0]
        this.prepareJSONRendering()
        const json = this.to().filterGroup('view').plain()
        json.reward = p[1][0]
        json.embeds = embeds
        json.reply_count = p[2]
        const target = p[3]
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
}

export class ThreadCollection extends Collection {
   
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    fetchRewards = async (society: SocietyModel, headerSig: IHeaderSignature | void) => ThreadModel.FetchRewards(this.local().map((t: ThreadModel) => t.get().pubKH()).join(','), society, headerSig)
    fetchCountReply = async (society: SocietyModel) => {
        const res = await this.sql().knex().select('target_pkh').table(this.sql().table().name()).where({sid: society.get().ID()}).whereIn('target_pkh', this.local().map((t: ThreadModel) => t.get().pubKH())).groupBy('target_pkh').count('* as count')
        const ret: ICountReply[] = []
        for (let o of res)
            ret.push({target_pkh: o.target_pkh, count: o.count})
        return ret
    }
    
    fetchByPubKH = async (sid: number, public_key_hashed: string) => await this.quick().find({ sid, public_key_hashed }) as ThreadModel
    pullBySID = async (sid: number, page: number) => await this.ctx().sql().pull().where({sid}).orderBy('id', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection    
    pullBySIDAndTargetPKH = async (sid: number, target_pkh: string, page: number) => await this.ctx().sql().pull().where({sid, target_pkh}).orderBy('id', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection    

    renderPreviewList = async (society: SocietyModel, headerSig: IHeaderSignature | void) => {
        const p = await Promise.all([
            this.fetchRewards(society, headerSig),
            embed.pullBySidsAndPKHs(this.local().map((t: ThreadModel) => t.get().sid()), this.local().map((t: ThreadModel) => t.get().pubKH())),
            this.fetchCountReply(society)
        ])
        
        const listRewards = p[0]
        const listEmbeds = p[1]
        const listCountReplies = p[2]
        listEmbeds.local().removeBy({type: 'PROPOSAL'})

        const ret: IPreviewThread[] = []
        for (let i = 0; i < listRewards.length; i++){
            const thread = this.local().nodeAt(i) as ThreadModel
            const r = {reward: listRewards[i], preview_code: '', content_link: thread.get().contentLink(), reply_count: 0 } as IPreviewThread
            const e = listEmbeds.local().find({ public_key_hashed: thread.get().pubKH() }) as EmbedModel
            if (e)
                r.preview_code = e.get().content()
            const count = _.find(listCountReplies, { target_pkh: thread.get().pubKH() })
            if (count)
                r.reply_count = count.count
            ret.push(r)
        }
        return ret
    }
}

export default new ThreadCollection([], {table: 'threads'})