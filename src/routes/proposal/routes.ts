import express from 'express'
import { proposal }  from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, CheckSIDAndAssignLinkToProposal, CheckSignatureContent, CheckContent, CheckIfAliasExist } from './middleware'
import { GetProposalList } from './methods'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()
    const { postHandler } = proposal.expressTools().request()

    server.post('/proposal', 
    bodyAssignator((req: express.Request) => {
        return {  content_link: '_', vote: '_', index: 0, author: '1111111111111111111111111111111111', public_key_hashed: '0000000000000000000000000000000000000000' }
    }),
    schemaValidator,
    CheckContent,
    CheckSignatureContent,
    CheckIfProposalAlreadyRecorded,
    CheckSIDAndAssignLinkToProposal,
    CheckIfAliasExist,
    postHandler(['content', 'title', 'public_key', 'signature', 'content_link', 'vote', 'index', 'author', 'public_key_hashed', 'sid'], 'author'))

    server.get('/proposal/:sid', GetProposalList)

}