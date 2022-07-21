import express from 'express'
import { thread } from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckSignatureContent } from '../proposal/middleware'
import { GetAndAssignLinkToThread, CheckIfThreadAlreadyRecorded, BuildEmbed, CheckContentOrTitlePresence } from './middleware'
import { GetThreadList, PostThread, GetThreadRepliesList, GetFullThread, GetUserThreadList} from './method'
import { CheckIfSocietyIDExistsByBodyParam, CheckIfSocietyIDExistsByRouteParam } from '../society'
import { CheckIfAliasExistByBody, CheckIfAliasExistByURLParam } from '../alias'

export default (server: express.Express) => { 

    const { schemaValidator } = thread.expressTools().middleware()

    server.post('/thread', 
        bodyAssignator(() => { return { content_link: '_', author: '1111111111111111111111111111111111', public_key_hashed: "0000000000000000000000000000000000000000", lugh_height: 1, target_pkh: null } }),
        schemaValidator,
        CheckContentOrTitlePresence,
        CheckSignatureContent,
        CheckIfSocietyIDExistsByBodyParam,
        CheckIfThreadAlreadyRecorded,
        GetAndAssignLinkToThread,
        CheckIfAliasExistByBody,
        BuildEmbed,
        PostThread,
    )

    server.get('/thread/:sid', CheckIfSocietyIDExistsByRouteParam, GetThreadList)
    server.get('/thread/:sid/:pubkh', CheckIfSocietyIDExistsByRouteParam, GetFullThread)

    server.get('/thread/replies/:sid/:pubkh', CheckIfSocietyIDExistsByRouteParam, GetThreadRepliesList)
    server.get('/thread/:sid/user/:address', CheckIfSocietyIDExistsByRouteParam, CheckIfAliasExistByURLParam, GetUserThreadList)
    

}