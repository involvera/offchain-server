import { Model, Collection } from "acey";

export class MemberModel extends Model {
    constructor(initialState: {addr: '', vp: 0}, options: any){
        super(initialState, options)
    }

    get = () => {
        return {
            address: (): string => this.state.addr,
            votePower: (): number => this.state.vp
        }
    }
}

export class MemberList extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [MemberModel, MemberList], options)
    }
}