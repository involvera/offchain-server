import express from 'express'
import initAlias from './alias'
import initSociety from './society'
import initProposal from './proposal/routes'
import initThread from './thread/routes'
import initAdmin from './admin'


export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
    initProposal(server)
    initThread(server)
    initAdmin(server)
}
