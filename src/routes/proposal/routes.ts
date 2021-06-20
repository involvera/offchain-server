import express from 'express'
import proposal from '../../models/proposal'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, CheckSIDAndAssignLinkToProposal, CheckSignatureOnProposalContent, CheckContent, CheckIfAliasExist } from './middleware'
import { PostProposal, GetProposalList } from './methods'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()

    server.post('/proposal', 
    bodyAssignator((req: express.Request) => {
        return {  content_link: '_', vote: '_', index: 0, author: '1111111111111111111111111111111111' }
    }),
    schemaValidator,
    CheckContent,
    CheckSignatureOnProposalContent,
    CheckIfProposalAlreadyRecorded,
    CheckSIDAndAssignLinkToProposal,
    CheckIfAliasExist,
    PostProposal)

    server.get('/proposal/:sid', GetProposalList)

}