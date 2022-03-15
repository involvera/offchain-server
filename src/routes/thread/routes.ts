import express from 'express'
import { thread } from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckSignatureContent } from '../proposal/middleware'
import { GetAndAssignLinkToThread, CheckIfThreadAlreadyRecorded, BuildEmbed, CheckContentOrTitlePresence } from './middleware'
import { GetThread, GetThreadList, PostThread} from './method'
import { CheckIfSocietyExistsByBodyParam, CheckIfSocietyExistsByRouteParam } from '../society'
import { CheckIfAliasExist } from '../alias'

export default (server: express.Express) => { 

    const { schemaValidator } = thread.expressTools().middleware()
    const { postHandler } = thread.expressTools().request()

    server.post('/thread', 
        bodyAssignator(() => { return { content_link: '_', author: '1111111111111111111111111111111111', public_key_hashed: "0000000000000000000000000000000000000000", lugh_height: 1 } }),
        schemaValidator,
        CheckContentOrTitlePresence,
        CheckSignatureContent,
        CheckIfSocietyExistsByBodyParam,
        CheckIfThreadAlreadyRecorded,
        GetAndAssignLinkToThread,
        CheckIfAliasExist,
        BuildEmbed,
        PostThread,
    )

    server.get('/thread/:sid', CheckIfSocietyExistsByRouteParam, GetThreadList)
    server.get('/thread/:sid/:pubkh', CheckIfSocietyExistsByRouteParam, GetThread)

}