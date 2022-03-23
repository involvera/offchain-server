import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import Knex from 'knex'
import { ParseEmbedInText } from 'involvera-content-embedding';
import { TPubKHContent } from 'wallet-script'

import { ProposalModel } from './proposal';
import { ThreadModel } from './thread';
import { ArrayObjToDoubleArray, MixArraysToArrayObj } from '../utils/express';
import society, { SocietyCollection, SocietyModel } from './society';
import { cachedSocieties } from '.';

export class EmbedModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        created_at: Joi.date().default('now'),
        public_key_hashed: Joi.string().min(0).max(40).hex(),
        index: Joi.number().max(2_000_000_000), 
        type: Joi.string().allow('PROPOSAL', 'THREAD').required(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        content: Joi.string().max(1000).group(['preview'])
    })

    constructor(initialState: any, options: any){
        super(initialState, EmbedModel, options)
    }

    get = () => {
        return {
            id: (): number => this.state.id,
            content: (): string => this.state.content,
            type: (): TPubKHContent => this.state.type,
            index: (): number | -1 => this.state.index,
            pubKH: (): string | null => this.state.public_key_hashed,
            createdAt: (): Date => this.state.created_at
        }
    }
}

const SET_SID_IDX = ['sid', 'index']
const SET_SID_PKH = ['sid', 'public_key_hashed']

export class EmbedCollection extends Collection {

    static FetchEmbeds = async (content: string, sid: number): Promise<EmbedCollection> => {
        const es = ParseEmbedInText(content)
        if (es.length == 0)
            return embedTable.new([]) as EmbedCollection
        const societiesName = _.uniq(es.filter((e) => !!e.society).map((e) => e.society))
        let currentSociety = society.newNode({}) as SocietyModel
        let societies = society.new([]) as SocietyCollection
        try {
            currentSociety = cachedSocieties.local().find({id: sid}) as SocietyModel
        } catch(e){
            throw e;
        }
        _.remove(societiesName, currentSociety.get().pathName())
        if (societiesName.length > 0)
            societies = cachedSocieties.local().filter({ path_name: societiesName}).parent() as SocietyCollection

        societies.local().push(currentSociety)
        let embeds = []
        for (const e of es){
            !e.society && embeds.push(Object.assign({}, e, {society: sid}))
            if (e.society){
                const s = societies.local().find({path_name: e.society}) as SocietyModel
                s && embeds.push(Object.assign({}, e, {society: s.get().ID() }))
            }
        }
        embeds = _.uniqWith(embeds, _.isEqual)
        return await embedTable.pullByIndexesOrPKHs(
            embeds.filter((e) => e.type === 'PROPOSAL').map((e) => e.society),
            embeds.filter((e) => e.type === 'PROPOSAL').map((e) => e.index),
            embeds.filter((e) => e.type === 'THREAD').map((e) => e.society),
            embeds.filter((e) => e.type === 'THREAD').map((e) => e.pkh)
        )
    }
    
    constructor(initialState: any, options: any){
        super(initialState, [EmbedModel, EmbedCollection], options)
    }

    create = () => {
        const thread = async (t: ThreadModel) => {
            const target = await t.get().target()
            return await this.copy().quick().create(t.toEmbedData(target)) as EmbedModel
        }
        const proposal = async (p: ProposalModel) => await this.copy().quick().create(p.toEmbedData()) as EmbedModel

        return { thread, proposal }
    }

    fetchByPKH = async (sid: number, public_key_hashed: string, type: TPubKHContent) => await this.quick().find({sid, public_key_hashed, type}) as EmbedModel
    fetchByIndex = async (sid: number, index: number) => await this.quick().find({sid, index}) as EmbedModel

    pullByIndexesOrPKHs = async (sidIDX: number[], indexes: number[], sidPKH: number[], pkhs: string[]) => {
        if (sidIDX.length != indexes.length)
            throw new Error("sid and index arrays don't have the same length")
        if (sidPKH.length != pkhs.length)
            throw new Error("sid and pkhs arrays don't have the same length")
        if (sidIDX.length > 0 && sidPKH.length > 0){
            const arrSidIdx = MixArraysToArrayObj(SET_SID_IDX, sidIDX, indexes)
            const arrSidPkh = MixArraysToArrayObj(SET_SID_PKH, sidPKH, pkhs)
            return await this.copy().sql().pull().custom((q: Knex.QueryBuilder): any => {
                return q.whereIn(SET_SID_IDX, ArrayObjToDoubleArray(arrSidIdx, SET_SID_IDX))
                .or.whereIn(SET_SID_PKH, ArrayObjToDoubleArray(arrSidPkh, SET_SID_PKH))
            }) as EmbedCollection
        }
        if (sidPKH.length > 0)
            return this.pullBySidsAndPKHs(sidPKH, pkhs)
        if (sidIDX.length > 0)
            return this.pullBySidsAndIndexes(sidIDX, indexes)
        
        return this.new([]) as EmbedCollection
    }

    pullBySidsAndIndexes = async (sids: number[], indexes: number[]) => {
        if (sids.length != indexes.length)
            throw new Error("sid and index arrays don't have the same length")
        const arr = MixArraysToArrayObj(SET_SID_IDX, sids, indexes)
        return await this.copy().sql().pull().whereIn(SET_SID_IDX, ArrayObjToDoubleArray(arr, SET_SID_IDX)).run() as EmbedCollection        
    }

    pullBySidsAndPKHs = async (sids: number[], pkhs: string[]) => {
        if (sids.length != pkhs.length)
            throw new Error("sid and pkhs arrays don't have the same length")
        const arr = MixArraysToArrayObj(SET_SID_PKH, sids, pkhs)
        return  await this.copy().sql().pull().whereIn(SET_SID_PKH, ArrayObjToDoubleArray(arr, SET_SID_PKH)).run() as EmbedCollection        
    }

    // pullByIDs = async (ids: number[]) => await this.copy().quick().pull('id', ids).run() as EmbedCollection
}


const embedTable = new EmbedCollection([], {table: 'embeds'})
export default embedTable