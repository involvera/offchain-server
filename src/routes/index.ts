import express from 'express'
import initAlias from './alias'
import initSociety from './society'
import initProposal from './proposal'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
    initProposal(server)
}
