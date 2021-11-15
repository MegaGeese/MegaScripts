var fs = require('fs');
const xml2js = require('xml2js');
let parser = new xml2js.Parser({explicitArray: false});
let path = process.argv[2];

function removeSingleLengthArray(json){
    //last person to work on these files left single length arrays throughout the data. This removes them. 
    if(typeof json == 'object' && Object.keys(json).length == 1){
        json = json[0];
    }
    if(typeof json == 'object'){
        for(key in json){
            json[key] = removeSingleLengthArray(json[key]);
        }
    }
    return json;
}

function removeUnderscore(json){
    //underscore objects are created when xml2js encounters data that is not part of a tag. These should be removed.
    delete json["_"];
    if(typeof json == 'object'){
        for(key in json){
            json[key] = removeUnderscore(json[key]);
        }
    }
    return json;
}

function recursivePathCrawl(path){
    //recursively parses the path provided above
    fs.readdir(path, function(err, fileNames) {
        fileNames.forEach(function(fileName) {
            if(fs.lstatSync(path + fileName).isDirectory()){
                console.log(path + fileName + ' ' + fs.lstatSync(path + fileName).isDirectory() + " is a directory, going deeper");
                recursivePathCrawl(path + fileName + '/');
            }
            else if(fileName.includes('.xml')){
                console.log("files detected in directory")
                processFilesInDir(path + fileName);
            }
        });
    });
}

function processFilesInDir(path){
    //some xml files were actually json, they need to be handled differently
    fs.readFile(path, 'utf-8', function(err, data){
        if(data[0] == '{'){
            console.log("json file detected at: " + path)
            let res = removeSingleLengthArray(JSON.parse(data).tutor);
            res = removeUnderscore(res);
            let Tdf = JSON.parse(data);
            Tdf.tutor = res;
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }
            fs.writeFileSync(path, JSON.stringify(Tdf, null, 4));
            fs.renameSync(path, path.replace('.xml', '.json'));
            console.log(path)
        }
        if(data[0] == '<'){
            console.log("xml file detected at: " + path)
            fs.readFile(path, function(err, data){
                parser.parseString(data, function (err, result) {
                    result = removeUnderscore(result);
                    fs.writeFileSync(path, JSON.stringify(result, null, 4));
                    fs.renameSync(path, path.replace('.xml', '.json'));
                    console.log(path + " converted successfully to json")
                });
            })
        }
    });
}
if(path){
    if(!path.endsWith('/')) path += '/';
    
    recursivePathCrawl(path);
}
else{
    console.log("no path provided, aborting");
}
