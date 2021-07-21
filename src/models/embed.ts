import { Joi, Collection, Model } from 'elzeard'
import { ParseEmbedInText, TEmbedType } from 'involvera-content-embedding';
import { ProposalModel } from './proposal';
import { ThreadModel } from './thread';
import Knex from 'knex'
import { ArrayObjToDoubleArray, MixArraysToArrayObj } from '../utils/express';
import society, { SocietyModel } from './society';
import { UUIDToPubKeyHashHex } from 'wallet-util';

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

    get = () => {
        return {
            id: (): number => this.state.id,
            content: (): string => this.state.content,
            type: (): TEmbedType => this.state.type,
            index: (): number | -1 => this.state.index,
            pubKH: (): string | null => this.state.public_key_hashed,
            createdAt: (): Date => this.state.created_at
        }
    }
}

export class EmbedCollection extends Collection {
    
    static FetchEmbeds = async (origin: ProposalModel | ThreadModel): Promise<EmbedCollection> => {
        const es = ParseEmbedInText(origin.get().content())
        if (es.length == 0)
            return embed.new([]) as EmbedCollection

        const societiesName = es.filter((e) => e.society != '').map((e) => e.society)
        try {
            const currentSociety = await society.fetchByID(origin.get().sid())
            currentSociety && societiesName.push(currentSociety.get().pathName())
        } catch(e){
            throw e;
        }
        const societies = await society.pullByPathName(societiesName)
        const embeds = []
        for (const e of es){
            !e.society && embeds.push(Object.assign({}, e, {society: origin.get().sid()}))
            if (e.society){
                const s = societies.local().find({path_name: e.society}) as SocietyModel
                s && embeds.push(Object.assign({}, e, {society: s.get().ID() }))
            }
        }

        return await embed.pullByIndexesOrPKHs(
            embeds.filter((e) => e.index != -1).map((e) => e.society),
            embeds.filter((e) => e.index != -1).map((e) => e.index),
            embeds.filter((e) => e.uuid != '').map((e) => e.society),
            embeds.filter((e) => e.uuid != '').map((e) => UUIDToPubKeyHashHex(e.uuid))
        )
    }
    
    constructor(initialState: any, options: any){
        super(initialState, [EmbedModel, EmbedCollection], options)
    }

    create = () => {
        const thread = async (t: ThreadModel) => await this.copy().quick().create(t.toEmbedData()) as EmbedModel

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


    pullByIndexesOrPKHs = async (sidIDX: number[], indexes: number[], sidPKH: number[], pkhs: string[]) => {
        const SET_SID_IDX = ['sid', 'index']
        const SET_SID_PKH = ['sid', 'public_key_hashed']
        
        const arrSidIdx = MixArraysToArrayObj(SET_SID_IDX, sidIDX, indexes)
        const arrSidPkh = MixArraysToArrayObj(SET_SID_PKH, sidPKH, pkhs)
        
        return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
            q.whereIn(SET_SID_IDX, ArrayObjToDoubleArray(arrSidIdx, SET_SID_IDX)).
            orWhereIn(SET_SID_PKH, ArrayObjToDoubleArray(arrSidPkh, SET_SID_PKH))
        }) as EmbedCollection
    }

    pullByIDs = async (list: number[]) => await this.copy().quick().pull('id', list).run() as EmbedCollection
}


const embed = new EmbedCollection([], {table: 'embeds'})
export default embed