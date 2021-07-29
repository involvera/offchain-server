import express from 'express'
import { proposal }  from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, GetAndAssignLinkToProposal, CheckSignatureContent, CheckContent, BuildEmbed } from './middleware'
import { GetProposalList, GetProposal } from './methods'
import { CheckIfSocietyExistsByBodyParam } from '../society'
import { CheckIfAliasExist } from '../alias'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()
    const { postHandler } = proposal.expressTools().request()

    server.post('/proposal', 
        bodyAssignator((req: express.Request) => {
            return {  content_link: '_', vote: '_', index: 0, author: '1111111111111111111111111111111111', public_key_hashed: '0000000000000000000000000000000000000000' }
        }),
        CheckSignatureContent,
        CheckIfSocietyExistsByBodyParam,
        CheckIfProposalAlreadyRecorded,
        GetAndAssignLinkToProposal,
        CheckContent,
        schemaValidator,
        CheckIfAliasExist,
        BuildEmbed,
        postHandler(['content', 'title', 'public_key', 'signature', 'content_link', 'vote', 'index', 'author', 'public_key_hashed', 'sid', 'lugh_height'], 'author')
    )

    server.get('/proposal/:sid/:index', GetProposal)

    server.get('/proposal/:sid', GetProposalList)

}