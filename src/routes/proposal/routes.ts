import express from 'express'
import { proposal }  from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, GetAndAssignLinkToProposal, CheckSignatureContent, CheckContent, BuildEmbed } from './middleware'
import { GetProposalList, GetProposal, PostProposal } from './methods'
import { CheckIfSocietyExistsByBodyParam, CheckIfSocietyExistsByRouteParam } from '../society'
import { CheckIfAliasExist } from '../alias'


export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()
    const { postHandler } = proposal.expressTools().request()

    server.post('/proposal', 
        bodyAssignator((req: express.Request) => {
            return {  index: 0, author: '1111111111111111111111111111111111', public_key_hashed: '0000000000000000000000000000000000000000' }
        }),
        CheckSignatureContent,
        CheckIfSocietyExistsByBodyParam,
        CheckIfProposalAlreadyRecorded,
        GetAndAssignLinkToProposal,
        CheckContent,
        schemaValidator,
        CheckIfAliasExist,
        BuildEmbed,
        PostProposal
    )

    server.get('/proposal/:sid/:index', CheckIfSocietyExistsByRouteParam, GetProposal)

    server.get('/proposal/:sid', CheckIfSocietyExistsByRouteParam, GetProposalList)

}