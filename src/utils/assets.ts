import { ServerConfiguration} from '../static/config'
const smartcrop = require('smartcrop-sharp')
import sharp from 'sharp'
import crypto from 'crypto'
import { Sha256 } from 'wallet-util'
import path from 'path'
import fs from 'fs'

export const getPX64FolderPath = () => path.join(ServerConfiguration.user_assets_path, 'pp64')
export const getPX500FolderPath = () => path.join(ServerConfiguration.user_assets_path, 'pp500')

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

export const buildAllPP = async (src: string) => {

    const mkdir = (p:string) => {
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, {recursive: true});
        }
    }
    mkdir(getPX64FolderPath())
    mkdir(getPX500FolderPath())

    const filename = Sha256(crypto.randomBytes(64)).toString('hex') + '.jpg'

    await Promise.all([
        build64PixelPP(src, path.join(getPX64FolderPath(), filename)),
        build500PixelPP(src, path.join(getPX500FolderPath(), filename)),
    ])
    return filename
}