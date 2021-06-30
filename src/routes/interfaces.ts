export interface IOutput {
    input_src_idxs: number[]
    value: string
    script: string[]
}

export interface IKindLink {
    tx_id: string
    lh: number
    vout: number
    output: IOutput
    target_content: string
}

export interface IVote {
    closed_at_lh: number
    approved: number
    declined: number
}

export interface IContentLink {
    vote: IVote
    index: number
    link: IKindLink
    pubkh_origin: string
}

export interface IReactionLink {
    tx_id: string
    vout: number
    output: IOutput
    category: number
    pubkh_origin: string
}