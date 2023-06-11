const CustomErrors = require('./custom-api')

class Forbidden extends CustomErrors {
    constructor(message){
        super(message)
        this.statusCode = 403
    }
}

module.exports = Forbidden