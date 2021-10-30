import { Joi, Collection, Model } from 'elzeard'
import { Constitution as C } from 'wallet-script'
import fetch from 'node-fetch'

export interface ICost {
    thread: number
    proposal: number
    upvote: number
    reaction_0: number
    reaction_1: number
    reaction_2: number
}

export interface IScriptOrigin {
    tx_id: string | null
    vout: number
}

export interface IScriptProposal {
    origin: IScriptOrigin
    pubkh: string
    content_nonce: number
}

export interface IConstitutionData {
    proposal: IScriptProposal
    constitution: C.TConstitution
}

export interface ILastCostChangeProposal {
    created_at: number
    pubkh: string
    index: number
    price: number
}

export interface ISocietyStats {
    last_height: number,
    active_addresses: number
    most_active_addresses: string[],
    circulating_supply: string
    total_contributor: number
    circulating_vp_supply: string
}

export interface ISociety {
    id: number
    name: string
    created_at: Date
    currency_symbol: string
    description: string
    domain: string,
    currency_route_api: string
    stats: ISocietyStats
    costs: ICost
    constitution: IConstitutionData
    last_thread_cost_change_proposal: ILastCostChangeProposal
    last_proposal_cost_change_proposal: ILastCostChangeProposal
}

export interface IContributorStats { 
    addr: string
    position: number
    sid: number
}

export class SocietyModel extends Model {

    private _stats: ISociety = null
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

    fetchStatsSha = async () => {
        const res = await fetch(this.get().currencyRouteAPI() + `/society/hash`)
        if (res.status == 200){
            return await res.json()
        } else {
            throw new Error(await res.text())
        }
    }

    pullStats = async () => {
        try {
            const hash = await this.fetchStatsSha()
            if (hash != this._prevHash){
                this._prevHash = hash
                const r = await fetch(this.get().currencyRouteAPI() + `/society`)
                if (r.status == 200){
                    const stats = await r.json()
                    const o = {
                        constitution: stats.constitution,
                        costs: stats.costs
                    }
                    delete stats.constitution
                    delete stats.costs
                    this._stats = Object.assign({}, this.to().plain(), {stats}, o)
                    return this.get().stats()
                }
            }
        } catch (e){
            throw new Error(await e.text())
        }
    }

    get = () => {
        return {
            stats: (): ISociety => this._stats,
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

    fetchByID = async (id: number) => await this.quick().find({id}) as SocietyModel

    pullByPathName = async (pathName: string[]) => await this.copy().sql().pull().whereIn('path_name', pathName).run() as SocietyCollection
}

export default new SocietyCollection([], {table: 'societies'})