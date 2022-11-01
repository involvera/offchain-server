import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import Knex from 'knex'
import { ParseEmbedInText, PREVIEW_SEPATOR } from 'involvera-content-embedding';
import { TPubKHContent } from 'wallet-script/dist/src/content-code'

import { ProposalModel } from './proposal';
import { ThreadModel } from './thread';
import { AliasModel } from './alias'
import { ArrayObjToDoubleArray, MixArraysToArrayObj } from '../utils/express';
import society, { SocietyCollection, SocietyModel } from './society';
import { cachedSocieties } from '.';
import { Inv } from 'wallet-util';

export class EmbedModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        sid: Joi.number().foreignKey('societies', 'id').noPopulate().required(),
        author: Joi.string().foreignKey('aliases', 'address').noPopulate().required(),

        created_at: Joi.date().default('now'),
        public_key_hashed: Joi.string().min(0).max(40).hex(),
        index: Joi.number().max(2_000_000_000),
        type: Joi.string().allow('PROPOSAL', 'THREAD').required(),
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
            sid: (): number => this.state.sid,
            index: (): number | -1 => this.state.index,
            pubKH: (): Inv.PubKH | null => this.state.public_key_hashed ? Inv.PubKH.fromHex(this.state.public_key_hashed) : null,
            author: (): Inv.Address => new Inv.Address(this.state.author),
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

    fetchByPKH = async (sid: number, pubkh: Inv.PubKH, type: TPubKHContent) => await this.quick().find({sid, public_key_hashed: pubkh.hex(), type}) as EmbedModel
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
        return await this.copy().sql().pull().whereIn(SET_SID_PKH, ArrayObjToDoubleArray(arr, SET_SID_PKH)).run() as EmbedCollection        
    }

    updateAllEmbedWithAuthorChange = async (author: AliasModel) => {
        const list = await this.ctx().sql().pull().where({author: author.get().address().get() }).run()
        
        const authString = JSON.stringify({address: author.get().address().get(), pp: author.get().ppURI(), username: author.get().username()})
        for (let i = 0; i < list.local().count(); i++){
            const m = list.local().nodeAt(i) as EmbedModel 
            const splited = m.get().content().split(PREVIEW_SEPATOR)
            if (m.get().index() > 0){
                splited[2] = authString
            } else {
                splited[1] = authString
            }
            m.setState({content: splited.join(PREVIEW_SEPATOR)})          
        }
        return await list.local().saveToDB()
    }
}


const embedTable = new EmbedCollection([], {table: 'embeds'})
export default embedTable