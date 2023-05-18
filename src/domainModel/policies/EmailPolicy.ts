
export class EmailPolicyImpl {

    static checkEmail(email: string) {
        const matches = email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
        return matches;
    }

}