import createHash from 'create-hash'

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)

const VERSION = 0x00
const ADDR_CHECKSUM_LENGTH = 4

const encodeBase58 = (data: Buffer): string => bs58.encode(data)

export const Sha256 = (val: string | Buffer): Buffer => {
    return createHash('sha256').update(val).digest()
}

export const Ripemd160 = (val: string | Buffer): Buffer => {
    return createHash('ripemd160').update(val).digest()
}

export const ToPubKeyHash = (pubk: string | Buffer) => {
    return Ripemd160(Sha256(pubk))
}

const checksum = (payload: Buffer): Buffer => {
    const doubleSha = Sha256(Sha256(payload))
    return doubleSha.slice(0, ADDR_CHECKSUM_LENGTH)
}

export const GetAddressFromPubKeyHash = (pubKeyHash: Buffer): string => {
    const versionedPayload = Buffer.concat([Buffer.from([VERSION]), pubKeyHash])
    const chksum = checksum(versionedPayload)

    const fullPayload = Buffer.concat([pubKeyHash, chksum])
    const address = encodeBase58(fullPayload)

    return (VERSION+1).toString() + address
}
