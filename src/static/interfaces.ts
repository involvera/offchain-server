import { 
    IVoteSummary, IUserVote, IConstitutionRule, 
    ISocietyStats, ICostProposal, ICostHistory,
    IThreadReward, IKindLinkUnRaw
} from 'community-coin-types'
import { TPubKHContent } from 'wallet-script/dist/src/content-code'
import { ProposalModel } from '../models'

export interface IHeaderSignature {
    pubkey: string
    signature: string
}

export interface IPreviewProposal {
    preview_code: string
    user_vote: IUserVote
    vote: IVoteSummary
}

export interface IPreviewThread{
    preview_code: string
    content_link: IKindLinkUnRaw
    reward: IThreadReward
    reply_count: number
}

export interface IPostEmbed {
    public_key_hashed: string
    index: number
    type: TPubKHContent,
    content: string
    sid: number
    spname: string
}

export interface IConstitutionData {
    proposal: ProposalModel
    constitution: IConstitutionRule[]
}

export interface ILocalSocietyStats {
    id: number
    name: string
    created_at: Date
    currency_symbol: string
    description: string
    domain: string,
    currency_route_api: string
    stats: ISocietyStats
    costs: ICostProposal
    constitution: IConstitutionData
    last_thread_cost_change_proposal: ICostHistory
    last_proposal_cost_change_proposal: ICostHistory
}

export interface ICountReply {
    target_pkh: string
    count: number
}

interface IMYSQL {
    host: string
    user: string
    password: string
    database: string
}
interface ISSL {
    key: string
    cert: string
}
export interface IServerConfigJSON {
    production: boolean
    port: number
    history_dir_path: string
    mysql: IMYSQL
    ssl?: ISSL
    assets_dir_path:string
    admin_key: string
}