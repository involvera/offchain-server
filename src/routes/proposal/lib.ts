import { Script } from "wallet-script";
import { Inv } from "wallet-util";
import { ProposalModel, SocietyModel } from "../../models";

export const fetchAndPickRightProposalContext = async (society: SocietyModel, pubKH: Inv.PubKH, script: Script) => {
    const proposalType = script.typeD2()
    if (proposalType != 'APPLICATION'){
        const context = await ProposalModel.fetchProposalContext(society, pubKH)
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