const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema({
    platform:{
        type:String,
        required:true
    },
    handle:{
        type:String,
        required:true
    },
    profileUrl:{
        type:String,
    },
    rating:{
        type:Number,
        default:0
    },
    maxRating:{
        type:Number,
        default:0
    },
    rank:{
        type:String,
        default:""
    },
    maxRank:{
        type:String,
        default:""
    },
    solvedCount:{
        type:Number,
        default:0
    },
    contestsCount:{
        type:Number,
        default:0
    },
    rawData:{
        type:Object,
        default:{}
    },
},{timestamps:true});

const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);
module.exports = CodingProfile;