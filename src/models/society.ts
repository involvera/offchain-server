import _ from 'lodash'
import { Joi, Collection, Model } from 'elzeard'
import axios from 'axios'
import { proposal } from './'
import { ISocietyStats  } from 'community-coin-types'
import {  ILocalSocietyStats } from '../static/interfaces'


export class SocietyModel extends Model {

    private _stats: ILocalSocietyStats = null
    private _prevHash: string = 'empty'

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(3).max(30).trim().regex(/[\w \d]*/).replace(/\s\s+/, ' ').required().example('Involvera'),
        path_name: Joi.string().min(3).max(20).lowercase().regex(/[\w\d]*/).unique().required().example('involvera'),
        currency_route_api: Joi.string().uri().max(255).unique().required().example('https://165.123.232.121:1001'),
        currency_symbol: Joi.string().min(2).max(5).alphanum().required().example('cInv'),
        description: Joi.string().max(140).trim().replace(/\n/g, '').replace(/\s\s+/g, ' ').example('A community platform that hierarchize members with decentralized governance based on a liquid economy.'),
        domain: Joi.string().hostname().example('involvera.com'),
        pp: Joi.string().max(255),
        created_at: Joi.date().default('now'),
    })

    constructor(initialState: any, options: any){
        super(initialState, SocietyModel, options)
    }

    private __getPrevHash = () => this._prevHash
    private __setPrevHash = (hash: string) => this._prevHash = hash
    private __setStats = (stats: ILocalSocietyStats) => this._stats = stats

    fetchStatsSha = async () => {
        const res = await axios.get(this.get().currencyRouteAPI() + `/society/hash`, {
            validateStatus: function (status) {
                return status >= 200 && status <= 500
            }
        })
        if (res.status == 200){
            return res.data as string
        } else {
            throw new Error(res.data)
        }
    }

    pullStats = async () => {
        try {
            const hash = await this.fetchStatsSha()
            if (hash != this.__getPrevHash()){
                this.__setPrevHash(hash)
                const res = await axios(this.get().currencyRouteAPI() + `/society`, {
                    validateStatus: function (status) {
                        return status >= 200 && status <= 500
                    }
                })
                if (res.status == 200){
                    let stats = res.data as ISocietyStats
                    const p = await proposal.fetchByPubKH(this.get().ID(), stats.constitution.proposal.pubkh)
                    const renderedStats = _.cloneDeep(stats as any) as ILocalSocietyStats
                    if (p){
                        await p.pullOnChainData(this)
                        renderedStats.constitution.proposal = p
                    } else 
                        renderedStats.constitution.proposal = null
                        
                    const o = {
                        constitution: renderedStats.constitution,
                        costs: renderedStats.costs
                    }
                    delete renderedStats.constitution
                    delete renderedStats.costs
                    this.__setStats(Object.assign({}, this.to().plain(), {stats: renderedStats}, o))
                }
            }
            return this.get().stats()
        } catch (e){
            throw new Error(e)
        }
    }

    get = () => {
        return {
            stats: (): ILocalSocietyStats => this._stats,
            ID: (): number => this.state.id,
            name: (): string => this.state.name,
            pathName: (): string => this.state.path_name,
            currencyRouteAPI: (): string => this.state.currency_route_api,
            currencySymbol: (): string => this.state.currency_symbol,
            description: (): string => this.state.description,
            domain: (): string => this.state.domain,
            createdAt: (): Date => this.state.created_at,
        }
    }
}

export class SocietyCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [SocietyModel, SocietyCollection], options)
    }

    pullAll = async () => {
          const res = await this.quick().pull().run()
          this.local().set(res.local().to().plain())
    }

    findByID = (id: number) => this.local().find({id}) as SocietyModel
    findByPathName = (name: string) => this.local().find({path_name: name}) as SocietyModel
}

export default new SocietyCollection([], {table: 'societies'})