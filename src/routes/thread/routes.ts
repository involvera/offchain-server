import express from 'express'
import thread from '../../models/thread'
import { bodyAssignator } from '../../utils'
import { CheckSignatureContent, CheckIfAliasExist } from '../proposal/middleware'
import { CheckSIDAndAssignLinkToThread, CheckIfThreadAlreadyRecorded } from './middleware'
import { PostThread} from './method'

export default (server: express.Express) => { 

    const { schemaValidator } = thread.expressTools().middleware()

    server.post('/thread', 
    bodyAssignator(() => { return { content_link: '_', author: '1111111111111111111111111111111111' } }),
    schemaValidator,
    CheckSignatureContent,
    CheckIfThreadAlreadyRecorded,
    CheckSIDAndAssignLinkToThread,
    CheckIfAliasExist,
    PostThread)

    // server.get('/proposal/:sid', GetProposalList)

}