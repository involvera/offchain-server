import { Joi, Collection, Model } from 'elzeard'
import {  IKindLink } from '../routes/interfaces'
import { BuildThreadPreviewString } from 'involvera-content-embedding'
import { AliasModel } from './alias'
import { T_FETCHING_FILTER } from '../static/types'
import Knex from 'knex'
import { EmbedCollection } from './embed'
import { reward } from './'
import { REWARD_CATEGORIES } from './reward'

interface IRewardCount {
    n_upvote: number
    n_reward_0: number
    n_reward_1: number
    n_reward_2: number
}

export class ThreadModel extends Model {

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

    getRewards = async () => {
        const res = await this.sql().knex().raw(`
            SELECT
                sum(case when category = ? then 1 else 0 end) AS n_upvote,
                sum(case when category = ? then 1 else 0 end) AS n_reward_0,
                sum(case when category = ? then 1 else 0 end) AS n_reward_1,
                sum(case when category = ? then 1 else 0 end) AS n_reward_2
            FROM
                ${reward.sql().table().name()}
            WHERE 
                target_pkh=?
        `, (REWARD_CATEGORIES as string[]).concat([this.get().pubKH()]))
        return res[0][0] as IRewardCount
    }

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
            contentLink: (): IKindLink => {
                if (typeof this.state.content_link == 'string')
                    return JSON.parse(this.state.content_link)
                return this.state.content_link
            },
        }
    }

    prepareJSONRendering = () => this.setState({ content_link: this.get().contentLink() }, true)

    renderJSON = async (filter: T_FETCHING_FILTER)  => {
        let embeds: string[] = []
        if (filter != 'preview')
            embeds = await this.get().embeds()
        this.prepareJSONRendering()
        const json = this.to().filterGroup(filter).plain()
        if (filter == 'preview')
            json.preview = this.get().preview().embed_code
        json.rewards = await this.getRewards()
        json.embeds = embeds
        return json
    }
}

export class ThreadCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ThreadModel, ThreadCollection], options)
    }

    getRewards = async () => {
        const rewardTable = reward.sql().table().name()
        const res = await this.sql().knex().from(rewardTable).select('category', 'target_pkh').whereIn('target_pkh', this.local().map((t: ThreadModel) => t.get().pubKH() ))
    }

    fetchByPubK = async (public_key: string) => await this.quick().find({ public_key }) as ThreadModel
    fetchByPubKH = async (sid: number, public_key_hashed: string) => await this.quick().find({ sid, public_key_hashed }) as ThreadModel
 
    pullBySID = async (sid: number, page: number) => await this.copy().sql().pull().where({sid}).orderBy('created_at', 'desc').offset(page * 10).limit((page+1) * 10).run() as ThreadCollection    
    pullByPubKHs = async (sid: number, pubkhs: string[]) => {
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
            return q.where({sid}).whereIn('public_key_hashed', pubkhs)
        }) as ThreadCollection
    }
    
    //Improve this method to execute only ONE getRewards request to pull all the rewards count at once.
    renderJSON = (filter: T_FETCHING_FILTER): any => {
        return Promise.all(this.local().map(async (t: ThreadModel) => {
            return await t.renderJSON(filter)
        }))
    }
}

export default new ThreadCollection([], {table: 'threads'})