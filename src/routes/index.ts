import express from 'express'
import initAlias from './alias'
import initProposal from './proposal/routes'
import initSociety from './society'
import initThread from './thread/routes'
import initAdmin from './admin'
import initReward from './reward'
import initEmbeds from './embed'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
    initProposal(server)
    initThread(server)
    initAdmin(server)
    initReward(server)
    initEmbeds(server)
}
