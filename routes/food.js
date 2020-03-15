/**
 * Created by hoangnd on 8/7/17.
 */
var router = global.router;
let Food = require('../models/FoodModel');
var mongoose = require('mongoose');
let fs = require('fs');

router.get('/list_all_foods', (request, response, next) => {
    //response.end("GET requested => list_all_foods");
    Food.find({}).limit(100).sort({name: 1}).select({
        name: 1,
        foodDescription: 1,
        created_date: 1,
        status: 1
    }).exec((err, foods) => {
        if (err) {
            response.json({
                result: "failed",
                data: [],
                messege: `Error is : ${err}`
            });
        } else {
            response.json({
                result: "ok",
                data: foods,
                count: foods.length,
                messege: "Query list of foods successfully"
            });
        }
    });
});
//Example: http://localhost:3001/get_food_with_id?food_id=598a688878fee204ee51cd31
router.get('/get_food_with_id', (request, response, next) => {
    Food.findById(require('mongoose').Types.ObjectId(request.query.food_id),
        (err, food) => {
            if (err) {
                response.json({
                    result: "failed",
                    data: {},
                    messege: `Error is : ${err}`
                });
            } else {
                response.json({
                    result: "ok",
                    data: food,
                    messege: "Query food by Id successfully"
                });
            }
        });
});
//Example: http://localhost:3001/list_foods_with_criteria?name=salad&limit=10
router.get('/list_foods_with_criteria', (request, response, next) => {
    if (!request.query.name) {
        response.json({
            result: "failed",
            data: [],
            messege: "Input parameters is wrong!. 'name' must be not NULL"
        });
    }
    let criteria = {
        //name: new RegExp(request.query.name, "i"),// <=> where name like '%abc%' in sql
        //Example: http://localhost:3001/list_foods_with_criteria?name=japanese%20salad
        name: new RegExp('^' + request.query.name + '$', "i"),//"i" = case-insensitive
    };
    const limit = parseInt(request.query.limit) > 0 ? parseInt(request.query.limit) : 100;
    Food.find(criteria).limit(limit).sort({name: 1}).select({
        name: 1,
        foodDescription: 1,
        created_date: 1,
        status: 1
    }).exec((err, foods) => {
        if (err) {
            response.json({
                result: "failed",
                data: [],
                messege: `Error is : ${err}`
            });
        } else {
            response.json({
                result: "ok",
                data: foods,
                count: foods.length,
                messege: "Query list of foods successfully"
            });
        }
    });
});
router.post('/insert_new_food', (request, response, next) => {
    console.log(`request.body.name = ${request.body.name}`);
    const newFood = new Food({
        name: request.body.name,
        foodDescription: request.body.foodDescription
    });
    newFood.save((err) => {
        debugger;
        if (err) {
            response.json({
                result: "failed",
                data: {},
                messege: `Error is : ${err}`
            });
        } else {
            response.json({
                result: "ok",
                data: {
                    name: request.body.name,
                    foodDescription: request.body.foodDescription,
                    messege: "Insert new food successfully"
                }
            });
        }
    });
});

router.put('/update_a_food', (request, response, next) => {
    let conditions = {};//search record with "conditions" to update
    if (mongoose.Types.ObjectId.isValid(request.body.food_id) == true) {
        conditions._id = mongoose.Types.ObjectId(request.body.food_id);
    } else {
        response.json({
            result: "failed",
            data: {},
            messege: "You must enter food_id to update"
        });
    }
    let newValues = {};
    if (request.body.name && request.body.name.length > 2) {
        newValues.name = request.body.name;
    }
    //Update image
    if (request.body.image_name && request.body.image_name.length > 0) {
        //Ex: http://localhost:3001/open_image?image_name=upload_e2312e497df8c230b4896fa3b43bb543.jpg
        const serverName = require("os").hostname();
        const serverPort = require("../app").settings.port;
        newValues.imageUrl = `${serverName}:${serverPort}/open_image?image_name=${request.body.image_name}`
    }
    const options = {
        new: true, // return the modified document rather than the original.
        multi: true
    }
    if (mongoose.Types.ObjectId.isValid(request.body.category_id) == true) {
        newValues.categoryId = mongoose.Types.ObjectId(request.body.category_id);
    }
    Food.findOneAndUpdate(conditions, {$set: newValues}, options, (err, updatedFood) => {
        if (err) {
            response.json({
                result: "failed",
                data: {},
                messege: `Cannot update existing food.Error is : ${err}`
            });
        } else {
            response.json({
                result: "ok",
                data: updatedFood,
                messege: "Update food successfully"
            });
        }
    });
});
router.post('/upload_images', (request, response, next) => {
    let formidable = require('formidable');
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = "./uploads";
    form.keepExtensions = true;
    form.maxFieldsSize = 10 * 1024 * 1024; //10 MB
    form.multiples = true;
    form.parse(request, (err, fields, files) => {
        if (err) {
            response.json({
                result: "failed",
                data: {},
                messege: `Cannot upload images.Error is : ${err}`
            });
        }
        
        var arrayOfFiles = [];
        if(files[""] instanceof Array) {
            arrayOfFiles = files[""];
        } else {
            arrayOfFiles.push(files[""]);
        }
        
        if (arrayOfFiles.length > 0) {
            var fileNames = [];
            arrayOfFiles.forEach((eachFile)=> {
                // fileNames.push(eachFile.path)
                fileNames.push(eachFile.path.split('/')[1]);
            });
            response.json({
                result: "ok",
                data: fileNames,
                numberOfImages: fileNames.length,
                messege: "Upload images successfully"
            });
        } else {
            response.json({
                result: "failed",
                data: {},
                numberOfImages: 0,
                messege: "No images to upload !"
            });
        }
    });
});
router.get('/open_image', (request, response, next) => {
    let imageName = "uploads/" + request.query.image_name;
    fs.readFile(imageName, (err, imageData) => {
        if (err) {
            response.json({
                result: "failed",
                messege: `Cannot read image.Error is : ${err}`
            });
            return;
        }
        response.writeHead(200, {'Content-Type': 'image/jpeg'});
        response.end(imageData); // Send the file data to the browser.
    });
});

router.delete('/delete_a_food', (request, response, next) => {
    response.end("DELETE requested => delete_a_food");
});
module.exports = router;

