import { 
    OFFCHAIN,
    ONCHAIN
} from 'community-coin-types'
import { TPubKHContent } from 'wallet-script/dist/src/content-code'

export interface IPostEmbed {
    public_key_hashed: string
    index: number
    type: TPubKHContent,
    content: string
    sid: number
    spname: string
}

export interface ILocalSocietyStats {
    stats: OFFCHAIN.ISocietyStats
    costs: ONCHAIN.ICostProposal
    constitution: OFFCHAIN.IConstitutionData
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