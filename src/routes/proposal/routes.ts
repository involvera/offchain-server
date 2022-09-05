import express from 'express'
import { proposal }  from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckIfProposalAlreadyRecorded, GetAndAssignLinkToProposal, CheckSignatureContent, CheckContent, BuildEmbed } from './middleware'
import { GetProposalList, GetProposal, PostProposal } from './methods'
import { CheckIfSocietyIDExistsByBodyParam, CheckIfSocietyIDExistsByRouteParam } from '../society'
import { CheckIfAliasExistByBody } from '../alias'
import { Inv } from 'wallet-util'

export default (server: express.Express) => { 

    const { schemaValidator } = proposal.expressTools().middleware()

    server.post('/proposal', 
        bodyAssignator((req: express.Request) => {
            return {  index: 0, author: '1111111111111111111111111111111111', public_key_hashed: Inv.PubKH.random().hex(), context: '' }
        }),
        CheckSignatureContent,
        CheckIfSocietyIDExistsByBodyParam,
        CheckIfProposalAlreadyRecorded,
        GetAndAssignLinkToProposal,
        CheckContent,
        schemaValidator,
        CheckIfAliasExistByBody,
        BuildEmbed,
        PostProposal
    )

    server.get('/proposal/:sid/:index', CheckIfSocietyIDExistsByRouteParam, GetProposal)

    server.get('/proposal/:sid', CheckIfSocietyIDExistsByRouteParam, GetProposalList)

}