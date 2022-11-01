import express from 'express'
import morgan from 'morgan'
import { config } from 'elzeard'
import { cachedSocieties, embed, EmbedCollection, EmbedModel, thread, proposal } from './models'
import cors from 'cors'
import { loadServerConfiguration, ServerConfiguration} from './static/config'

export const initCachedData = async () => {
  await cachedSocieties.pullAll(); 
}

const updateEmbedIfRequired = async () => {
  const list = await embed.quick().pull({author: null}).run() as EmbedCollection
  let count = 0
  for (let i = 0; i < list.local().count(); i++){
    const e = list.local().nodeAt(i) as EmbedModel
    if (e.get().index() < 1 && !e.state.author){
      const t = await thread.fetchByPubKH(e.get().sid(), e.get().pubKH())
      await e.setState({ author: t.get().author().get().address().get() }).saveToDB()
      count++
    }
    if (e.get().index() > 0 && !e.state.author) {
      const p = await proposal.fetchByIndex(e.get().sid(), e.get().index())
      await e.setState({ author: p.get().author().get().address().get() }).saveToDB()
      count++
    }
  }
  console.log(count, 'embeds updated')
}

export const initServer = async () => {
    await loadServerConfiguration()
    
    const server = express()
    server.use(express.json({
      limit: '4MB'
    }))
    server.use(morgan('tiny') as any)

    server.use(function(req, res, next) {
      res.header("Access-Control-Allow-Headers", "Access-Control-Max-Age, Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type,Accept, signature, public_key, admin_key, page, filter, sid, target_pkh, group");
      res.header("Access-Control-Allow-Origin", "*"); 
      res.header("Access-Control-Max-Age", "7200")
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
      next();
    });

    server.use(cors())

    // // stores state locally, don't use this in production
    // var store = new ExpressBrute.MemoryStore();
    // var bruteforce = new ExpressBrute(store);
    // server.use(bruteforce.prevent)

    config.setHistoryDirPath(ServerConfiguration.history_dir_path)
    config.setMySQLConfig(Object.assign({timezone: 'utc'}, ServerConfiguration.mysql))

    /*
      This is important to make sure mariadb is correctly 
      launched when using docker. 
      
      i) You can remove this line if the tables are already created.

      i2) increase the timeout if you encounter problems 
          with table creation
    */
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await config.done()
    try {
      await initCachedData()
      await updateEmbedIfRequired()
    } catch (e){
      console.log(e)
      process.exit(0)
    }
    return server
}