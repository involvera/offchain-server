import { IVote } from "../routes/interfaces"

export type TEmbedType = 'proposal' | 'thread' 

export interface IEmbed {
    type: TEmbedType
    embed_code: string
}
export const BuildThreadEmbedString = (pkh: string, author: any, created_at: Date, target_id: string | null, title: string, text: string): IEmbed => {
    
    // PKH (string) ; author (IAuthor) ; created_at (Date) ; PKH_TARGET (string | null) ; ___Title___ (string) ; ===Text===
    const embed_code = `
    ${pkh};
    ${author};
    ${created_at.toString()}
    ${target_id};
    ___${title}___;
    ===${text}===    
    `.replace('\n', '')
    
    return { type: 'thread', embed_code }
}

export const BuildProposalEmbedString = (pkh: string, type: string, created_at: Date, vote: IVote, title: string): IEmbed => {
    
    //PKH (string) ; type (string) ; created_at (Date) ; vote (IVOTE) ; Title
    const embed_code = `
    ${pkh};
    ${type};
    ${created_at.toString()}
    ${JSON.stringify(vote)};
    ${title};
    `.replace('\n', '')

    return { type: 'proposal', embed_code }
}

export const CutText = (textMarkdown: string): string => {
    var md = require('markdown-it')();
    const htmlText = md.render(textMarkdown)
    let text = htmlText.replace(/(<([^>]+)>)/gi, "");
    text = text.replace('\n', ' ')
    text = text.replace(/\s+/g, " ");

    const MAX_LENGTH = 140

    const hasWhiteSpace = (s: string) => /\s/g.test(s);

    let smaller_index = 15000
    let length = -1
    for (let i = 0; i < EMBED_REGEX.length; i++){
        const m = text.match(EMBED_REGEX[i])
        if (m && m.index < smaller_index){            
            length = m[0].length
            smaller_index = m.index
        }
    }

    if (length == -1 || smaller_index >= MAX_LENGTH){
        let i = MAX_LENGTH-1
        while (!hasWhiteSpace(text[i]))
            i--
        return text.slice(0, i)
    }

    return text.slice(0, smaller_index + length)
}

const EMBED_REGEX = [
    /%\[https:\/\/\involvera\.com\/[\w\-]{1,255}\/proposal\/\d{1,10}]/,
    /%\[(https|http):\/\/\involvera\.com\/[\w\-]{1,255}\/thread\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}]/
]