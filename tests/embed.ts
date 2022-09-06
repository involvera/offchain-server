import { expect } from 'chai';
import 'mocha';

import { BuildThreadPreviewString, BuildProposalPreviewString } from '../src/utils/embeds'
import { PREVIEW_SEPATOR, StringToParsedPreview, IProposalPreview, IThreadPreview } from 'involvera-content-embedding'

export default () => {

    describe('preview.ts', async () => {

        const o:any = {
            pkh: '02e3f082896ebf8692a8c324362cd762b8f191d5',
            author: {
                username: 'fantasim',
                pp: null,
                address: '1GHQu3CDZpPZGb6PmaBPP4sZNuT13sja1'
            },
            created_at: new Date(),
            target: null,
            title: 'hello',
            content: 'This is a shitty content.',
            sid: 1,
            spname: 'involvera'
        }

        it('BuildThreadPreviewString : Basic', () =>{
            const preview0 = BuildThreadPreviewString(o)
            const res0 = o.pkh + PREVIEW_SEPATOR + JSON.stringify(o.author) + PREVIEW_SEPATOR + Math.round(o.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + o.title + PREVIEW_SEPATOR + o.content + PREVIEW_SEPATOR + o.sid + PREVIEW_SEPATOR + o.spname
            expect(preview0.embed_code).to.eq(res0)

            const p = StringToParsedPreview(preview0.embed_code)
            expect(p.author?.address).eq(o.author.address)
            expect(p.author?.username).eq(o.author.username)
            expect(p.author?.pp).eq(null)
            expect(p.pkh).eq(o.pkh)
            expect(p.created_at).eq(Math.round(o.created_at.getTime() / 1000))
            expect(p.target).eq(null)
            expect(p.title).eq(o.title)
            expect(p.content).eq(o.content)
            expect(p.sid).eq(o.sid)
            expect(p.type).eq('THREAD')
            expect(p.vote).eq(undefined)
            expect(p.proposal_layer).eq(undefined)
            expect(p.index).eq(undefined)
        })


        it('BuildThreadPreviewString : Basic 2 ', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = '# OOP State Manager built with Lodash.\n#### What kind of power it gives me ?\nTo Encapsulate your **states** you **need** to *go* on my website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data in a ONE and SAME place. 🔌'
            o2.title = 'acey the best framwork'
            o2.created_at = new Date()

            const contentFormat = `To Encapsulate your states you need to go on my website google.com inside <a href="http://dev.nodeca.com">Models</a> and <a href="http://dev.nodeca.com">Collection</a> to treat, access, format, and <a href="http://dev.nodeca.com">organize</a> your data in a ONE and...`
            
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + o2.title + PREVIEW_SEPATOR + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })

        it('BuildThreadPreviewString : Basic 2 Title Less', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = '# OOP State Manager built with Lodash.\n#### What kind of power it gives me ?\nTo Encapsulate your **states** you **need** to *go* on my website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data in a ONE and SAME place. 🔌'
            o2.title = ''
            o2.created_at = new Date()

            const contentFormat = `To Encapsulate your states you need to go on my website google.com inside <a href="http://dev.nodeca.com">Models</a> and <a href="http://dev.nodeca.com">Collection</a> to treat, access, format, and <a href="http://dev.nodeca.com">organize</a> your data in a ONE and SAME place. 🔌`
            
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })

        it('BuildThreadPreviewString : Basic 3 Long Content', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = 'To Encapsulate your **states** you **need** to *go* on my website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data. To Encapsulate your **states** you **need** to *go* on my website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data.'
            o2.title = ''
            o2.created_at = new Date()

            const contentFormat = `To Encapsulate your states you need to go on my website google.com inside <a href="http://dev.nodeca.com">Models</a> and <a href="http://dev.nodeca.com">Collection</a> to treat, access, format, and <a href="http://dev.nodeca.com">organize</a> your data. To Encapsulate your states you nee...`
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })


        it('BuildThreadPreviewString : Complex Content 1', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = `<p align="center" font-style="italic"><a><img alt="acey" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4d414141336e377a50737134685544396a32334f48674f764a495531646c466178417569517a43773971464d4867.png?raw=true" width="100%"></a>+ Control. | - Code. | + Scalability. | - Debugging. | + Productivity.</p><br />\n# OOP State Manager built with Lodash. ⚡\n#### What kind of power it gives me ?\n**To Encapsulate your states inside Models and Collections to treat, access, format, and organize your data in a ONE and SAME place. 🔌**\n<br />\n<p align="center">\n<a><img src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f63646e342e69636f6e66696e6465722e636f6d2f646174612f69636f6e732f6c6f676f732d332f3630302f52656163742e6a735f6c6f676f2d3235362e706e67.png?raw=true" width="70px"></a></p>\n#### I work on React {Native}, can I use it ?\n**Yes, Acey works [smoothly](http://dev.nodeca.com) with React environment, its dev experience is the logical evolution of Redux.<br />On Acey there is:<br />- No action types. ✅<br />- No reducers. ✅<br />- No [Models](http://dev.nodeca.com). ✅<br />- No context. ✅<br />AND you can trigger your actions from wherever you want without any binding. 💥**`
            o2.title = ''
            o2.created_at = new Date()

            const contentFormat = `To Encapsulate your states inside Models and Collections to treat, access, format, and organize your data in a ONE and SAME place. 🔌 Yes, Acey works <a href="http://dev.nodeca.com">smoothly</a> with React environmen...`
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR  + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })

        it('BuildThreadPreviewString : Complex Content 2', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = `<p align="center"><a><img src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f63646e2e66726565626965737570706c792e636f6d2f6c6f676f732f7468756d62732f32782f6e6f64656a732d312d6c6f676f2e706e67.png?raw=true" width="130px"></a></p>\n#### It works as well with NodeJS, right?\n**Yes, so Acey enable a built-in feature auto-syncing your states with your local storage. So Acey, in NodeJS applications, use this feature by storing your state in a JSON DB 🗄️.<br />When your program run, all your JSON files are pulled and directly added in the state of your collection (It's 100% cached 📚).<br /><br />So yeah, it works amazing for embedded systems, CLI tools, prototypes, MVP, or any other program that can work with a full DB cached. 💨**\n<br />\n<br />\n<br />\n<br />\n<p align="center"><a target="_blank" href="https://github.com/arysociety/acey/blob/master/docs/api.md"><img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4341416b707232446f6e514936737635385130795974794c70424f416d53533933767431635a6c514f7834726951.png?raw=true"/></a><img width="2%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>\n<a href="#get-started"><img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4941444d4e4238536857303377377277747457505a716c73624b5757773235765f4c536e474c4f705555746a4351.png?raw=true"/></a>\n<img width="2%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>\n<a target="_blank" href="https://github.com/AceyJS/acey/tree/master/examples">\n<img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f45414355784b4a574e484238714e594959557243466e334f77516e3976792d513048416e4f506532776f70757277.png?raw=true"/>\n</a></p>\n<br /><br /><br /><br />`
            o2.title = ''
            o2.created_at = new Date()

            const contentFormat = `Yes, so Acey enable a built-in feature auto-syncing your states with your local storage. So Acey, in NodeJS applications, use this feature by storing your state in a JSON DB 🗄️.Wh...`
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })

        it('BuildThreadPreviewString : Complex Content 2 - 1', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = `<p align="center"><a><img src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f63646e2e66726565626965737570706c792e636f6d2f6c6f676f732f7468756d62732f32782f6e6f64656a732d312d6c6f676f2e706e67.png?raw=true" width="130px"></a></p>\n#### It works as well with NodeJS, right?\n**Yes, so Acey enable a built-in feature auto-syncing your states with your local storage. So Acey, in NodeJS applications, use this feature by storing your [state](http://dev.nodeca.com) in a JSON DB 🗄️.<br />When your program run, all your JSON files are pulled and directly added in the state of your collection (It's 100% cached 📚).<br /><br />So yeah, it works amazing for embedded systems, CLI tools, prototypes, MVP, or any other program that can work with a full DB cached. 💨**\n<br />\n<br />\n<br />\n<br />\n<p align="center"><a target="_blank" href="https://github.com/arysociety/acey/blob/master/docs/api.md"><img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4341416b707232446f6e514936737635385130795974794c70424f416d53533933767431635a6c514f7834726951.png?raw=true"/></a><img width="2%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>\n<a href="#get-started"><img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4941444d4e4238536857303377377277747457505a716c73624b5757773235765f4c536e474c4f705555746a4351.png?raw=true"/></a>\n<img width="2%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>\n<a target="_blank" href="https://github.com/AceyJS/acey/tree/master/examples">\n<img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f45414355784b4a574e484238714e594959557243466e334f77516e3976792d513048416e4f506532776f70757277.png?raw=true"/>\n</a></p>\n<br /><br /><br /><br />`
            o2.title = ''
            o2.created_at = new Date()

            const contentFormat = `Yes, so Acey enable a built-in feature auto-syncing your states with your local storage. So Acey, in NodeJS applications, use this feature by storing your <a href="http://dev.nodeca.com">state</a> in a JSON DB 🗄️.Wh...`
            const preview2 = BuildThreadPreviewString(o2)
            const res2 = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + contentFormat + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res2)
        })

        it('BuildThreadPreviewString : Thread to Thread', () => {
            const o2:any = {
                pkh: '99a4f123456ebf8692a8c324362cf762b8f191d5',
                author: {
                    username: 'pedro',
                    pp: null,
                    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'
                },
                created_at: new Date(),
                target: o,
                title: '',
                content: 'Yes I agree your content is a really a big piece of shit.',
                sid: 1,
                spname: 'involvera'
            }
            const res = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + JSON.stringify(o) + PREVIEW_SEPATOR + 'null' + PREVIEW_SEPATOR + o2.content + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            const preview = BuildThreadPreviewString(o2)
            expect(preview.embed_code).to.eq(res)

            const p = StringToParsedPreview(preview.embed_code)
            expect(p.author?.address).eq(o2.author.address)
            expect(p.author?.username).eq(o2.author.username)
            expect(p.author?.pp).eq(null)
            expect(p.pkh).eq(o2.pkh)
            expect(p.created_at).eq(Math.round(o2.created_at.getTime() / 1000))
            expect(JSON.stringify(p.target)).eq(JSON.stringify(o))
            expect(p.title).eq(o2.title)
            expect(p.content).eq(o2.content)
            expect(p.sid).eq(o2.sid)
            expect(p.type).eq('THREAD')
            expect(p.vote).eq(undefined)
            expect(p.proposal_layer).eq(undefined)
            expect(p.index).eq(undefined)
        })

        it('BuildThreadPreviewString : Thread to Thread Long HTML content', () => {
            const oo = JSON.parse(JSON.stringify(o)) as IThreadPreview
            oo.content = `To Encapsulate your **states** you **need** to *go* on my${PREVIEW_SEPATOR} website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data. To Encapsulate your **states** you **need** to *go* on my website google.com inside [Models](http://dev.nodeca.com) and [Collection](http://dev.nodeca.com) to treat, access, format, and [organize](http://dev.nodeca.com) your data.`
            oo.title = `That's such an amazing content full of focus and clarity`
            oo.created_at = new Date()
            
            const o2:any = {
                pkh: '99a4f123456ebf8692a8c324362cf762b8f191d5',
                author: {
                    username: 'pedro',
                    pp: null,
                    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'
                },
                created_at: new Date(),
                target: JSON.parse(JSON.stringify(oo)),
                title: 'Well, this title is pretty inovative. Love it.',
                content: oo.content,
                sid: 1,
                spname: 'involvera'
            }

            oo.content = `To Encapsulate your states you need to go on my website google.com inside Models and...`
            const O2_CONTENT = `To Encapsulate your states you need to go on my website google.com inside <a href="http://dev.nodeca.com">Models</a> and <a href="http://dev.nodeca.com">Collection</a> to treat, access, format, and...`

            const res = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + JSON.stringify(oo) + PREVIEW_SEPATOR + o2.title + PREVIEW_SEPATOR + O2_CONTENT + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            const preview = BuildThreadPreviewString(o2)
            expect(preview.embed_code).to.eq(res)

            const p = StringToParsedPreview(preview.embed_code)
            expect(p.author?.address).eq(o2.author.address)
            expect(p.author?.username).eq(o2.author.username)
            expect(p.author?.pp).eq(null)
            expect(p.pkh).eq(o2.pkh)
            expect(p.created_at).eq(Math.round(o2.created_at.getTime() / 1000))
            expect(JSON.stringify(p.target)).eq(JSON.stringify(oo))
            expect(p.title).eq(o2.title)
            expect(p.content).eq(O2_CONTENT)
            expect(p.sid).eq(o2.sid)
            expect(p.type).eq('THREAD')
            expect(p.vote).eq(undefined)
            expect(p.proposal_layer).eq(undefined)
            expect(p.index).eq(undefined)
        })

        it('BuildThreadPreviewString : Thread to Proposal', () => {
            const proPre: IProposalPreview = {
                index: 19,
                layer: 'COSTS',
                created_at: new Date(),
                author: {
                    username: 'pedro',
                    pp: null,
                    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'
                },
                vote: {
                    approved: -1,
                    declined: -1,
                    closed_at_lh: 18
                },
                title: `Salut les posto, n'ayez pas peur de mon propo`,
                sid: 1,
                spname: 'involvera'
            }
            const o2:any = {
                pkh: '99a4f123456ebf8692a8c324362cf762b8f191d5',
                author: {
                    username: 'pedro',
                    pp: null,
                    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'
                },
                created_at: new Date(),
                target: proPre,
                title: 'We have to approve it',
                content: 'Amazing content, right?',
                sid: 1,
                spname: 'involvera'
            }
            const res = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + JSON.stringify(proPre) + PREVIEW_SEPATOR + o2.title + PREVIEW_SEPATOR + o2.content + PREVIEW_SEPATOR + o2.sid + PREVIEW_SEPATOR + o2.spname
            const preview = BuildThreadPreviewString(o2)
            expect(preview.embed_code).to.eq(res)

            const p = StringToParsedPreview(preview.embed_code)
            expect(p.author?.address).eq(o2.author.address)
            expect(p.author?.username).eq(o2.author.username)
            expect(p.author?.pp).eq(null)
            expect(p.pkh).eq(o2.pkh)
            expect(p.created_at).eq(Math.round(o2.created_at.getTime() / 1000))
            expect(JSON.stringify(p.target)).eq(JSON.stringify(proPre))
            expect(p.title).eq(o2.title)
            expect(p.content).eq(o2.content)
            expect(p.sid).eq(o2.sid)
            expect(p.type).eq('THREAD')
            expect(p.vote).eq(undefined)
            expect(p.proposal_layer).eq(undefined)
            expect(p.index).eq(undefined)
        })

        it('BuildProposalPreviewString : Proposal', () => {
            const pro: IProposalPreview = {
                index: 19,
                layer: 'COSTS',
                created_at: new Date(),
                author: {
                    username: 'pedro',
                    pp: null,
                    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'
                },
                vote: {
                    approved: -1,
                    declined: -1,
                    closed_at_lh: 18
                },
                title: `Salut les posto, n'ayez pas peur de mon propo`,
                sid: 1,
                spname: 'involvera'
            }
            const preview = BuildProposalPreviewString(pro)
            expect(preview.type).to.eq('PROPOSAL')
            const res = pro.index + PREVIEW_SEPATOR + pro.layer + PREVIEW_SEPATOR + JSON.stringify(pro.author) + PREVIEW_SEPATOR + Math.round(pro.created_at.getTime() / 1000) + PREVIEW_SEPATOR + JSON.stringify(pro.vote) + PREVIEW_SEPATOR + pro.title + PREVIEW_SEPATOR + pro.sid + PREVIEW_SEPATOR + pro.spname
            expect(preview.embed_code).to.eq(res)
        })

        it('BuildThreadPreviewString : Basic 4 ', () =>{
            const o2 = JSON.parse(JSON.stringify(o)) as IThreadPreview
            o2.content = `Here my favorite Thread: involvera.com/involvera/thread/af53ae357d42b460838f4f4157cd579de0f9d6fd \n            and these are the 3 proposals I like:\n1. /involvera/proposal/8 \n2. http://localhost:3000/involvera/proposal/9 \n3. involvera.com/involvera/proposal/10`
            o2.title = 'acey the best framwork'
            o2.created_at = new Date()
            
            const preview2 = BuildThreadPreviewString(o2)
            expect(preview2.type).to.eq('THREAD')
            const res = o2.pkh + PREVIEW_SEPATOR + JSON.stringify(o2.author) + PREVIEW_SEPATOR + Math.round(o2.created_at.getTime() / 1000) + PREVIEW_SEPATOR + JSON.stringify(o2.target) + PREVIEW_SEPATOR + o2.title + PREVIEW_SEPATOR + "Here my favorite Thread: involvera.com/involvera/thread/af53ae357d42b460838f4f4157cd579de0f9d6fd and these are the 3 proposals I like:" + PREVIEW_SEPATOR + o2.sid+ PREVIEW_SEPATOR + o2.spname
            expect(preview2.embed_code).to.eq(res)
        })


    })
}