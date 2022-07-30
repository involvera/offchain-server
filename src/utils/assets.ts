const smartcrop = require('smartcrop-sharp')
import sharp from 'sharp'
import crypto from 'crypto'
import { Sha256 } from 'wallet-util'
import path from 'path'
import fs from 'fs'
import axios from 'axios'

import { ServerConfiguration} from '../static/config'

export const getPX64FolderPath = () => path.join(ServerConfiguration.assets_dir_path, 'pp64')
export const getPX500FolderPath = () => path.join(ServerConfiguration.assets_dir_path, 'pp500')

interface IBuildPPSettings {
    src: string
    px: number
    maxSizeOctets: number
    dest: string
}

const buildPxPP = async (settings: IBuildPPSettings) => {
    const { src, px, maxSizeOctets, dest} = settings
    let defaultQuality = 100
  
    const buildImage = async (quality: number) => {
        const result = await smartcrop.crop(src, { width: px, height: px })
        const crop = result.topCrop;
    
        return await sharp(src)
            .extract({ width: crop.width, height: crop.height, left: crop.x, top: crop.y })
            .resize(px, px)
            .jpeg({ quality })
            .toFile(dest);
    }

    while (true){
        let r = await buildImage(defaultQuality)
        if (r.size < maxSizeOctets)
            break
        defaultQuality -= 5
        if (defaultQuality === 0){
            fs.rmSync(dest)
            throw new Error("cant generate picture")
        }
    }
    return dest
}

export const build64PixelPP = (src: string, dest: string) => {
    return buildPxPP({
        src, 
        px: 64,
        maxSizeOctets: 1_500, 
        dest
    })
}

export const build500PixelPP = (src: string, dest: string) => {
    return buildPxPP({
        src, 
        px: 500,
        maxSizeOctets: 50_000, 
        dest
    })
}

const randomFileNameJPG = () => Sha256(crypto.randomBytes(64)).toString('hex') + '.jpg'

export const buildAllPP = async (src: string) => {
    mkdir(getPX64FolderPath())
    mkdir(getPX500FolderPath())

    const filename = randomFileNameJPG()

    await Promise.all([
        build64PixelPP(src, path.join(getPX64FolderPath(), filename)),
        build500PixelPP(src, path.join(getPX500FolderPath(), filename)),
    ])
    return filename
}

const mkdir = (p:string) => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
}

export const createTemporaryFile = async (base64: string): Promise<string | null> => {
    try {
        var data = base64.replace(/^data:image\/\w+;base64,/, '');
        const TMP_PATH = `/tmp/involvera/assets`
        mkdir(TMP_PATH)
        const filename = path.join(TMP_PATH, randomFileNameJPG())
    
        await fs.writeFileSync(filename, data, {encoding: 'base64'})
        return filename
    } catch (e){
        return null
    }
}

export const downloadLocalImage = async (filename: string, size: 64 | 500): Promise<Buffer | null> => {
    try {
        const f = await fs.readFileSync(path.join(size === 64 ? getPX64FolderPath() : getPX500FolderPath(), filename))
        return f
    } catch (e){
        return null
    }
}

export const downloadDistantImage = async (url: string) => {
    try {
        const response = await axios.get(url,  { responseType: 'arraybuffer' })
        if (response.status === 200)
            return Buffer.from(response.data, "utf-8")        
        return null
    } catch (e){
        return null
    }
  }