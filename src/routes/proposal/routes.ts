import express from 'express'
import proposal from '../../models/proposal'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, CheckSIDAndAssignLinkToProposal, CheckSignatureOnProposalContent } from './middleware'
import { PostProposal } from './methods'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()

    server.post('/proposal', 
    bodyAssignator((req: express.Request) => {
        return {  content_link: '_', vote: '_', index: 0, author_public_key_hashed: '0000000000000000000000000000000000000000' }
    }),
    schemaValidator,
    CheckSignatureOnProposalContent,
    CheckIfProposalAlreadyRecorded,
    CheckSIDAndAssignLinkToProposal,
    PostProposal
)
}