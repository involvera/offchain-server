import { 
    PREVIEW_SEPATOR, REGEX_SEPARATOR, 
    IPreview, IThreadPreview, IProposalPreview 
} from 'involvera-content-embedding'

const stripTags = (input: string, allowed: string) => {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('') // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
      commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
    })
}

export const BuildThreadPreviewString = (preview: IThreadPreview): IPreview => {
    const { pkh, author, created_at, target, sid, spname } = preview

    const title = (preview.title || '').replace(REGEX_SEPARATOR, '---')
    const titleLength = title ? title.length : 0
    const content = FormatMDTextToPreviewable(preview.content || '', 180 - Math.round(titleLength * 1.05))

    if (!!target && !!(target as any).content){
        (target as any).content = stripTags(FormatMDTextToPreviewable((target as any).content || '', 90), '')
    }

    // PKH (string) ~~~ author (IAuthor) ~~~ created_at (Date) ~~~ target: (IThreadPreview | null) ~~~ title ~~~ content ~~~ SID
    const embed_code = `${pkh}${PREVIEW_SEPATOR}${JSON.stringify(author)}${PREVIEW_SEPATOR}${Math.round(created_at.getTime() / 1000)}${PREVIEW_SEPATOR}${JSON.stringify(target)}${PREVIEW_SEPATOR}${title || null}${PREVIEW_SEPATOR}${content}${PREVIEW_SEPATOR}${sid}${PREVIEW_SEPATOR}${spname}`
    return { type: 'THREAD', embed_code }
}

export const BuildProposalPreviewString = (preview: IProposalPreview): IPreview => {
    const { index, layer, created_at, vote, sid, author, spname} = preview  

    const title = (preview.title || '').replace(REGEX_SEPARATOR, '---')

    //index (number) ~~~ layer (string) ~~~ created_at (Date) ~~~ vote (IVOTE) ~~~ Title ~~~ SID 
    const embed_code = `${index}${PREVIEW_SEPATOR}${layer}${PREVIEW_SEPATOR}${JSON.stringify(author)}${PREVIEW_SEPATOR}${Math.round(created_at.getTime() / 1000)}${PREVIEW_SEPATOR}${JSON.stringify(vote)}${PREVIEW_SEPATOR}${title}${PREVIEW_SEPATOR}${sid}${PREVIEW_SEPATOR}${spname}`

    return { type: 'PROPOSAL', embed_code }
}

export const FormatMDTextToPreviewable = (textMarkdown: string, maxLength: number): string => {
    const OPENING_P_TAG = '<p>'
    const CLOSING_P_TAG = '</p>'
    const REG = /<p.*?>(.*?)<\/p>/
    var md = require('markdown-it')()
    textMarkdown = textMarkdown.replace('\n', ' ')
    textMarkdown = textMarkdown.replace(/\s{2,}/g, ' ')
    textMarkdown = textMarkdown.replace(PREVIEW_SEPATOR, '')

    let data = ''
    let htmlText = md.render(stripTags(textMarkdown, ""))

    while (true){
        const ret = htmlText.match(REG) as any
        if (!ret) break
        const last = htmlText.indexOf(CLOSING_P_TAG)
        data += htmlText.slice(ret.index+OPENING_P_TAG.length, last)
        const isWordLetter = /[\da-zA-Z]/
        if (isWordLetter.test(data.charAt(data.length-1)))
            data += '. '
        else 
            data += ' '
        htmlText = htmlText.slice(last+CLOSING_P_TAG.length, htmlText.length)
    }
    data = (data || textMarkdown).replace(/\%\[(.*?)\]/g, '')
    data = FormatTagASize(stripTags(data, '<a>').trim())
    return formatContentWithSize(data, maxLength)
}

const formatContentWithSize = (content: string, max: number): string => {
    const REG = /<a.*?>(.*?)<\/a>/

    let text = content.slice()
    let newText = ''

    while(true){
        const ret = text.match(REG) as any
        if (!ret) break
        let i = ret.index
        while (text[i] != '>')
            i++
        const lengthText = ret[1].length

        newText += text.slice(0, ret.index)
        const newTextTagLess = newText.replace(/(<([^>]+)>)/gi, "")
        if (newTextTagLess.length >= max || (newTextTagLess.length + lengthText) >= max){
            return newText.slice(0, newText.length - (newTextTagLess.length - max)).trim() + '...'
        }
        newText += ret[0]
        text = text.slice(ret.index + ret[0].length, text.length)
    }
    if (!newText){
        if (text.length > max)
            return text.slice(0, max).trim() + '...'
        
    }
    const newTextTagLess = newText.replace(/(<([^>]+)>)/gi, "")
    if ((newTextTagLess.length + text.length) >= max)
        return newText + text.slice(0, max - newTextTagLess.length) + '...'
        
    return newText + text
}

const FormatTagASize = (content: string) => {
    const CLOSING_A_TAG = '</a>'
    const MAX_LENGTH = 30
    const REG = /<a.*?>(.*?)<\/a>/

    let text = content.slice()
    let newText = ''

    while (true){
        const ret = text.match(REG) as any
        if (!ret) break
        let i = ret.index
        while (text[i] != '>')
            i++
        const start = i
        const length = ret[1].length
        const copyText = text.slice()
        newText += copyText.slice(0, start+1)
        if (ret[1].length > MAX_LENGTH){
            newText += ret[1].slice(0, MAX_LENGTH).trim() + '...'
        } else {
            newText += ret[1]
        }
        newText += CLOSING_A_TAG
        text = text.slice(start + length + CLOSING_A_TAG.length+1, text.length)
    }
    return newText + text
}