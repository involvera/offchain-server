import { Joi, Collection, Model } from 'elzeard'
import { MemberList } from './member'
import fetch from 'node-fetch'
import { Constitution as C } from 'wallet-script'
import reward from './reward'

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
}

export interface IContributorStats { 
    addr: string
    position: number
    sid: number
}

export class SocietyModel extends Model {

    private _members: MemberList = null
    private _stats: ISociety = null

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        name: Joi.string().min(3).max(30).trim().regex(/[\w \d]*/).replace(/\s\s+/, ' ').required().example('Involvera'),
        path_name: Joi.string().min(3).max(20).lowercase().regex(/[\w\d]*/).unique().required().example('involvera'),
        currency_route_api: Joi.string().uri().max(255).unique().required().example('https://165.123.232.121:1001'),
        currency_symbol: Joi.string().min(2).max(5).alphanum().required().example('cInv'),
        description: Joi.string().max(140).trim().replace(/\n/g, '').replace(/\s\s+/g, ' ').example('A community platform that hierarchize members with decentralized governance based on a liquid economy.'),
        domain: Joi.string().hostname().example('involvera.com'),
        created_at: Joi.date().default('now'),
    })

    constructor(initialState: any, options: any){
        super(initialState, SocietyModel, options)
    }

    fetchContributorStats = (addr: string): IContributorStats  => {
        const index = this.get().members().findIndex({ addr })
        if (index > -1)
            return { sid: this.get().ID(), addr, position: index + 1 }
        return { sid: this.get().ID(), addr, position: this.get().members().count() }
    } 

    fetchStats = async () => {
        const r = await fetch(this.get().currencyRouteAPI() + `/society/stats`)
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
        return null
    }

    fetchMembers = async () => {
      try {
        const res = await fetch(`${this.get().currencyRouteAPI()}/society/members`)
        const str = await res.json()
        const array = str.split(';')
        const ret = []
        for (let elem of array){
            const split = elem.split(',')
            ret.push({ addr: split[0], vp: parseInt(split[1]) })
        }
        this._members = new MemberList(ret, {})
      } catch (e){
          console.log(`Error: unable to fetch members on society: ${this.get().name()} (${this.get().pathName()}) on url: ${this.get().currencyRouteAPI()}`)
          process.exit()
      }
    }

    get = () => {
        return {
            stats: (): ISociety => this._stats,
            members: (): MemberList => this._members, 
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
    
    fetchMembersFromAll = async () => {
        await Promise.all(this.local().map(async (s: SocietyModel) => {
            await s.fetchMembers()
            await s.fetchStats()
        }))
    }

    pullAll = async () => {
          const res = await this.quick().pull().run()
          this.local().set(res.local().to().plain())
    }

    fetchByID = async (id: number) => await this.quick().find({id}) as SocietyModel

    pullByPathName = async (pathName: string[]) => await this.copy().sql().pull().whereIn('path_name', pathName).run() as SocietyCollection
}

export default new SocietyCollection([], {table: 'societies'})