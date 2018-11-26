let ChatgroupModel = require('../model/chatgroup');
const STATUS_SUCCESS = 1;
const STATUS_ERROR = 0;
/*var md5 = require('md5');

function getToken (tok_1,tok_2) {
    return md5(tok_1+tok_2+'helloworld')
}*/

module.exports = {
    const: {
        STATUS_SUCCESS: STATUS_SUCCESS,
        STATUS_ERROR: STATUS_ERROR
    },
    joinGroup: (id_user, id_group) => {
        ChatgroupModel.getGroupsByGroupId(id_group, (err, result) => {
            if (!result.list_id_user_join.includes(id_user.toString())) {
                let list_id_user_join = result.list_id_user_join;
                list_id_user_join.push(id_user);
                ChatgroupModel.addUserToGroup(id_group, list_id_user_join);
                return true;
            }

            return false;
        });
    },
    findSocketId: (clientOnline, id_user) => {
        let id_client;
        let number_of_user = clientOnline.length;

        for (let i = 0; i < number_of_user; i++) {
            if (clientOnline[i].id_user == id_user) {
                id_client = clientOnline[i].id_client;
                break;
            }
        }

        return id_client;
    },
    /* checkToken: (id_user,id_client,token) => {
         return getToken(id_user,id_client) == token;
     }*/
};