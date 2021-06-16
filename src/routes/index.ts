import express from 'express'
import initAlias from './alias'
import initSociety from './society'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
    initSociety(server)
}
