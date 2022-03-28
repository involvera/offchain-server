import { 
    IVoteSummary, IUserVote, IConstitutionRule, 
    ISocietyStats, ICostProposal, ICostHistory,
    IThreadReward
} from 'community-coin-types'
import { TPubKHContent } from 'wallet-script'
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
    reward: IThreadReward
}

export interface IPostEmbed {
    public_key_hashed: string
    index: number
    type: TPubKHContent,
    content: string
    sid: number
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