import express from 'express'
import { ScriptEngine } from "wallet-script";
import { ToArrayBufferFromB64 } from "wallet-util";
import { ProposalModel, SocietyModel } from "../../models";
import { IHeaderSignature } from '../../static/interfaces';


export const fetchAndPickRightProposalContext = async (society: SocietyModel, pubkhHex: string, script: string[]) => {
    const proposalType = new ScriptEngine(ToArrayBufferFromB64(script)).proposalContentTypeString()
    if (proposalType != 'APPLICATION'){
        const context = await ProposalModel.fetchProposalContext(society, pubkhHex)
        if (!!context && typeof context !== 'string'){
            const { constitution, costs } = context
            switch (proposalType){
                case 'COSTS':
                    return JSON.stringify(costs)
                case 'CONSTITUTION':
                    return JSON.stringify(constitution)
            }
        } else {
            throw new Error(context as string)
        }
    }
    return '_'
}

export const getHeaderSignature = (req: express.Request): IHeaderSignature | void => {
    const { signature, pubkey } = req.headers
    let headerSig: IHeaderSignature = undefined
    if (signature && pubkey){
        headerSig = {signature: signature as string, pubkey: pubkey as string}
    }
    return headerSig
}