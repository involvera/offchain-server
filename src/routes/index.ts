import express from 'express'
import initAlias from './alias'
import initProposal from './proposal/routes'
import initSociety from './society'
import initThread from './thread/routes'
import initAdmin from './admin'
import initEmbeds from './embed'
import initPuts from './puts'
import initUsers from './user'

export const initRoutes = (server: express.Express) => {

    server.options("/*", function(req, res, next){
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.sendStatus(200);
      });

    initAlias(server)
    initSociety(server)
    initProposal(server)
    initThread(server)
    initAdmin(server)
    initEmbeds(server)
    initPuts(server)
    initUsers(server)
}
