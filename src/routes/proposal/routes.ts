import express from 'express'
import { proposal }  from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, GetAndAssignLinkToProposal, CheckSignatureContent, CheckContent, BuildEmbed } from './middleware'
import { GetProposalList, GetProposal, PostProposal } from './methods'
import { CheckIfSocietyExistsByBodyParam, CheckIfSocietyExistsByRouteParam } from '../society'
import { CheckIfAliasExistByBody } from '../alias'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()

    server.post('/proposal', 
        bodyAssignator((req: express.Request) => {
            return {  index: 0, author: '1111111111111111111111111111111111', public_key_hashed: '0000000000000000000000000000000000000000', context: '' }
        }),
        CheckSignatureContent,
        CheckIfSocietyExistsByBodyParam,
        CheckIfProposalAlreadyRecorded,
        GetAndAssignLinkToProposal,
        CheckContent,
        schemaValidator,
        CheckIfAliasExistByBody,
        BuildEmbed,
        PostProposal
    )

    server.get('/proposal/:sid/:index', CheckIfSocietyExistsByRouteParam, GetProposal)

    server.get('/proposal/:sid', CheckIfSocietyExistsByRouteParam, GetProposalList)

}