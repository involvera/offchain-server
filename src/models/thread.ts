import { Joi, Collection, Model } from 'elzeard'
import {  IKindLinkUnRaw, IReactionCount } from 'community-coin-types'
import { BuildThreadPreviewString } from 'involvera-content-embedding'
import { AliasModel } from './alias'
import { T_FETCHING_FILTER } from '../static/types'
import Knex from 'knex'
import { EmbedCollection } from './embed'
import fetch from 'node-fetch'

import { SocietyModel } from './society'

export class ThreadModel extends Model {

    static FetchRewards = async (pubkhs: string, society: SocietyModel) => {
        try {
            const res = await fetch(society.get().currencyRouteAPI() + '/threads/rewards',{
                headers: { list: pubkhs }
            })
            if (res.status == 200)
                return await res.json() as IReactionCount[]
        } catch(e){
            throw new Error(e)
        }
    }

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey().group(['full']),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required().group(['preview', 'view', 'full']),
        author: Joi.string().max(39).foreignKey('aliases', 'address', 'author').group(['preview', 'view', 'full']),

        lugh_height: Joi.number().positive().integer().max(2_000_000_000).required().group(['full']),
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

    toEmbedData = () => {
        return {
            public_key_hashed: this.get().pubKH(),
            index: -1,
            type: "thread",
            content: this.get().preview().embed_code,
            sid: this.get().sid()
        }
    }

    getRewards = async (society: SocietyModel) => ThreadModel.FetchRewards(this.get().pubKH(), society)

    get = () => {
        return {
            preview: () => {
                const link = this.get().contentLink()
                return BuildThreadPreviewString(this.get().pubKH(), this.get().author().to().filterGroup('author').string(), this.get().createdAt(), !link.target_content ? null : link.target_content, this.get().title(), this.get().content(), this.get().sid())
            },
            embeds: async () => {
                const list = await EmbedCollection.FetchEmbeds(this)
                return list.local().to().filterGroup('preview').plain().map((c: any) => c.content) as string[]
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
        }
    }

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderJSON = async (filter: T_FETCHING_FILTER, society: SocietyModel | null)  => {
        let embeds: string[] = []
        if (filter != 'preview')
            embeds = await this.get().embeds()
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        if (filter == 'preview')
            json.preview = this.get().preview().embed_code
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
 
    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection    
    pullByPubKHs = async (sid: number, pubkhs: string[]) => {
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
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