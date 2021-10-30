import express from 'express'
import initAlias from './alias'
import initProposal from './proposal/routes'
import initSociety from './society'
import initThread from './thread/routes'
import initAdmin from './admin'
import initEmbeds from './embed'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
    initProposal(server)
    initThread(server)
    initAdmin(server)
    initEmbeds(server)
}
