import express from 'express'
import initAlias from './alias'

export const initRoutes = (server: express.Express) => {
    initAlias(server)
}
