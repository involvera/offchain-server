import express from 'express'
import { thread } from '../../models'
import { bodyAssignator } from '../../utils'
import { CheckSignatureContent, CheckIfAliasExist } from '../proposal/middleware'
import { GetAndAssignLinkToThread, CheckIfThreadAlreadyRecorded } from './middleware'
import { GetThreadList} from './method'
import { CheckIfSocietyExistsByBodyParam } from '../society'

export default (server: express.Express) => { 

    const { schemaValidator } = thread.expressTools().middleware()
    const { postHandler } = thread.expressTools().request()


    server.post('/thread', 
        bodyAssignator(() => { return { content_link: '_', author: '1111111111111111111111111111111111', public_key_hashed: "0000000000000000000000000000000000000000" } }),
        schemaValidator,
        CheckSignatureContent,
        CheckIfSocietyExistsByBodyParam,
        CheckIfThreadAlreadyRecorded,
        GetAndAssignLinkToThread,
        CheckIfAliasExist,
        postHandler(['content', 'title', 'public_key', 'signature', 'content_link', 'author', 'public_key_hashed', 'sid'], 'author')
    )

    server.get('/thread/:sid', GetThreadList)

}