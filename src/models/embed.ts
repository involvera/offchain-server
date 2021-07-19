import { Joi, Collection, Model } from 'elzeard'
import { TEmbedType } from 'involvera-content-embedding';
import { ProposalModel } from './proposal';
import { ThreadModel } from './thread';
import Knex from 'knex'

export interface IEmbed {
    content: string
    type: TEmbedType
    public_key_hashed: string
    index?: number
    sid: number
    created_at: Date
}

export class EmbedModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        created_at: Joi.date().default('now'),
        public_key_hashed: Joi.string().min(0).max(40).hex(),
        index: Joi.number().positive().max(2_000_000_000), 
        type: Joi.string().allow('proposal', 'thread').required(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        content: Joi.string().max(1000)
    })

    constructor(initialState: any, options: any){
        super(initialState, EmbedModel, options)
    }
}

export class EmbedCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [EmbedModel, EmbedCollection], options)
    }

    create = () => {
        const thread = async (t: ThreadModel) => {
            return await this.copy().quick().create({
                public_key_hashed: t.get().pubKH(),
                index: -1,
                type: "thread",
                content: t.get().preview().embed_code,
                sid: t.get().sid()
            }) as EmbedModel
        }

        const proposal = async (p: ProposalModel) => {
            return await this.copy().quick().create({
                public_key_hashed: null,
                index: p.get().index(),
                type: "proposal",
                content: p.get().preview().embed_code,
                sid: p.get().sid()
            }) as EmbedModel
        }

        return { thread, proposal }
    }

    fetchByPKH = async (sid: number, public_key_hashed: string) => await this.quick().find({sid, public_key_hashed}) as EmbedModel
    fetchByIndex = async (sid: number, index: number) => await this.quick().find({sid, index}) as EmbedModel

    pullByIndexes = async (sid: number, indexes: number[]) => {
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
            q.where({sid}).whereIn('index', indexes)
        }) as EmbedCollection
    }

    pullByPKHs = async (sid: number, pkhs: string[]) => {
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
            q.where({sid}).whereIn('public_key_hashed', pkhs)
        }) as EmbedCollection
    }

    pullByIDs = async (list: number[]) => await this.copy().quick().pull('id', list).run() as EmbedCollection
}


export default new EmbedCollection([], {table: 'embeds'})