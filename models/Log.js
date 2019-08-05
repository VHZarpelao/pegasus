// Require
    // Modules
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

// Page model
const Log = new Schema({
    name: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required:true
    },
    date: {
        type: Date,
        default: Date.now(),
        required: true
    }
}); 

// Definir model no bd
mongoose.model('logs', Log);