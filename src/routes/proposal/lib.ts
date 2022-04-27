import { ScriptEngine } from "wallet-script";
import { ToArrayBufferFromB64 } from "wallet-util";
import { ProposalModel, SocietyModel } from "../../models";

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