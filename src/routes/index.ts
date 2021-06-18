import express from 'express'
import initAlias from './alias'
import initSociety from './society'
import initProposal from './proposal/routes'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
    initProposal(server)
}
