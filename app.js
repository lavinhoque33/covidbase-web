const express = require('express');
const mysql = require('mysql');
const bodyparser = require('body-parser');
const session = require('cookie-session');
const MongoClient = require('mongodb').MongoClient;
const murl = 'mongodb://localhost:27017/';
let db;

//create connection
MongoClient.connect(murl, {useNewUrlParser: true, useUnifiedTopology: true},function(err, tdb) {
        if(err)
            throw err;
        db=tdb.db('corona');
    }
);


let ses;
let searchID;
const app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.set('views', __dirname + '/Web');
//app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(session({
    secret: '&*^&#^jdhjshfdu124',
    resave: false,
    saveUninitialized: true
}));

function confSort(a, b) {
    if (a.Conf < b.Conf)
        return 1;
    else if (a.Conf > b.Conf)
        return -1;
    else
        return 0;
}

function drgSort(a, b) {
    if (a.drgcnt < b.drgcnt)
        return 1;
    else if (a.drgcnt > b.drgcnt)
        return -1;
    else
        return 0;
}

function disSort(a, b) {
    if (a.discnt < b.discnt)
        return 1;
    else if (a.discnt > b.discnt)
        return -1;
    else
        return 0;
}

function ddSort(a, b) {
    if (a.ddcnt < b.ddcnt)
        return 1;
    else if (a.ddcnt > b.ddcnt)
        return -1;
    else
        return 0;
}

function dgSort(a, b) {
    if (a.dgcount < b.dgcount)
        return 1;
    else if (a.dgcount > b.dgcount)
        return -1;
    else
        return 0;
}

function dpSort(a, b) {
    if (a.dpcount < b.dpcount)
        return 1;
    else if (a.dpcount > b.dpcount)
        return -1;
    else
        return 0;
}

function gSort(a, b) {
    if (a.gcount < b.gcount)
        return 1;
    else if (a.gcount > b.gcount)
        return -1;
    else
        return 0;
}

function pSort(a, b) {
    if (a.pcount < b.pcount)
        return 1;
    else if (a.pcount > b.pcount)
        return -1;
    else
        return 0;
}

function sortTop(arr, type) {
    let a;
    let retList = new Set();
    if (type === 'drg') {
        a = arr.sort(drgSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i]._id.replace(/^\w/, c => c.toUpperCase()));
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'dis') {
        a = arr.sort(disSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i]._id.replace(/^\w/, c => c.toUpperCase()));
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'gene') {
        a = arr.sort(gSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'mirna') {
        a = arr.sort(gSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'lncrna') {
        a = arr.sort(gSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'pdb') {
        a = arr.sort(pSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Pdb.toUpperCase());
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'dg') {
        a = arr.sort(dgSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Disease.replace(/^\w/, c => c.toUpperCase()) + '+' + a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'dm') {
        a = arr.sort(dgSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Disease.replace(/^\w/, c => c.toUpperCase()) + '+' + a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'dl') {
        a = arr.sort(dgSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Disease.replace(/^\w/, c => c.toUpperCase()) + '+' + a[i].Gene);
            if (retList.size >= 5)
                break;
        }
    } else if (type === 'dp') {
        a = arr.sort(dpSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Drug.replace(/^\w/, c => c.toUpperCase()) + '+' + a[i].Pdb.toUpperCase());
            if (retList.size >= 5)
                break;
        }
    } else {
        a = arr.sort(ddSort);
        for (let i = 0; i < a.length; i++) {
            retList.add(a[i].Disease.replace(/^\w/, c => c.toUpperCase()) + '+' + a[i].Drug.replace(/^\w/, c => c.toUpperCase()));
            if (retList.size >= 5)
                break;
        }
    }
    return retList;
}

function getsearch(resp, rpage, obj) {
    db.collection('diseases').find({}).toArray(function(err, results) {
        if (err)
            throw err;
        let dppairs = {}, ddpairs = {}, dgpairs = {}, dmpairs = {}, dlpairs = {};
        let pdbs = new Set();
        let diseases = [], drugs = [];
        let genes = new Set(), mirnas = new Set(), lncrnas = new Set();
        for(let i=0;i<results.length;i++){
            diseases.push(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
            if(results[i].Drug){
                for(let j=0;j<results[i].Drug.length;j++){
                    ddpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Drug[j].Name.replace(/^\w/, c => c.toUpperCase())] = null;
                }
            }
            if(results[i].Genes){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'HGNC'){
                        genes.add(results[i].Genes[j].Gene);
                        dgpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }else if(results[i].Genes[j].Type === 'miRNA'){
                        mirnas.add(results[i].Genes[j].Gene);
                        dmpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }else if(results[i].Genes[j].Type === 'lncRNA'){
                        lncrnas.add(results[i].Genes[j].Gene);
                        dlpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }
                }
            }
        }
        lncrnas = Array.from(lncrnas);
        mirnas = Array.from(mirnas);
        genes = Array.from(genes);
        lncrnas.sort(sortThings);
        mirnas.sort(sortThings);
        genes.sort(sortThings);
        let lnclist = {}, milist = {}, genelist = {};
        lncrnas.forEach(item => lnclist[item] = null);
        mirnas.forEach(item => milist[item] = null);
        genes.forEach(item => genelist[item] = null);
        diseases = Array.from(diseases);
        dis = {};
        diseases.sort(sortThings);
        diseases.forEach(item => dis[item] = null);

        db.collection('drugs').find({}).toArray(function(err, results) {
            if (err)
                throw err;
            for(let i=0;i<results.length;i++){
                drugs.push(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
                if(results[i].PDBS){
                    for(let j=0;j<results[i].PDBS.length;j++){
                        pdbs.add(results[i].PDBS[j].PDB);
                        dppairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].PDBS[j].PDB] = null;
                    }
                }
            }
            pdbs = Array.from(pdbs);
            pdbs.sort(sortThings);
            let pdblist = {};
            pdbs.forEach(item => pdblist[item] = null);
            drugs = Array.from(drugs);
            drgs = {};
            drugs.sort(sortThings);
            drugs.forEach(item => drgs[item] = null);
            let a = {
                ddpairs: ddpairs,
                dgpairs: dgpairs,
                dmpairs: dmpairs,
                dlpairs: dlpairs,
                dppairs: dppairs,
                diseases: dis,
                drugs: drgs,
                lncrnas: lnclist,
                mirnas: milist,
                genes: genelist,
                pdbs: pdblist
            };
            a = {...a, ...obj};
            resp.render(rpage, a);
        });
    });
}

function sortThings(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return a > b ? 1 : b > a ? -1 : 0;
}

app.get('/', (req, resp) => {
    ses = req.session;
    db.collection('drugs').findOneAndUpdate({'_id':'vcount'},{'$inc': {'count':1}},{upsert:true},function(err, results){
        if(err)
            throw err;
    });
    resp.redirect(`/search`);
});
app.get(`/searchresult`, (req, resp) => {
    ses = req.session;
    resp.render('login', {
        stats: ses.stats,
    });
});
app.get(`/manual`, (req, resp) => {
    ses = req.session;
    getsearch(resp,'manual',{});
});
app.get(`/credits`, (req, resp) => {
    ses = req.session;
    resp.render('credit', {
        stats: ses.stats,
    });
});
app.get('/search', (req, resp) => {
    ses = req.session;
    db.collection('diseases').find({}).toArray(function(err, results) {
        if (err)
            throw err;
        let dpcnt = 0;
        let dppairs = {}, ddpairs = {}, dgpairs = {}, dmpairs = {}, dlpairs = {};
        let pdbs = new Set(),dgs = new Set();
        let diseases = [], drugs = [];
        let dgcnt = 0, dmcnt = 0, dlcnt = 0;
        let gsorts = [], misorts = [], lncsorts = [], ddsorts = [], dpsorts = [];
        let genes = new Set(), mirnas = new Set(), lncrnas = new Set();
        for(let i=0;i<results.length;i++){
            diseases.push(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
            if(results[i].Drug){
                for(let j=0;j<results[i].Drug.length;j++){
                    ddsorts.push({'Disease':results[i]._id,'Drug':results[i].Drug[j].Name,'ddcnt':results[i].Drug[j].ddcnt});
                    ddpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Drug[j].Name.replace(/^\w/, c => c.toUpperCase())] = null;
                }
            }
            if(results[i].Genes){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'HGNC'){
                        dgcnt++;
                        genes.add(results[i].Genes[j].Gene);
                        gsorts.push({'Disease':results[i]._id,'Gene':results[i].Genes[j].Gene,'gcount':results[i].Genes[j].gcount,'dgcount':results[i].Genes[j].dgcount});
                        dgpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }else if(results[i].Genes[j].Type === 'miRNA'){
                        dmcnt++;
                        mirnas.add(results[i].Genes[j].Gene);
                        misorts.push({'Disease':results[i]._id,'Gene':results[i].Genes[j].Gene,'gcount':results[i].Genes[j].gcount,'dgcount':results[i].Genes[j].dgcount});
                        dmpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }else if(results[i].Genes[j].Type === 'lncRNA'){
                        dlcnt++;
                        lncrnas.add(results[i].Genes[j].Gene);
                        lncsorts.push({'Disease':results[i]._id,'Gene':results[i].Genes[j].Gene,'gcount':results[i].Genes[j].gcount,'dgcount':results[i].Genes[j].dgcount});
                        dlpairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].Genes[j].Gene] = null;
                    }
                }
            }
        }
        let geneTop = Array.from(sortTop(gsorts, 'gene'));
        let mirnaTop = Array.from(sortTop(misorts, 'mirna'));
        let lncrnaTop = Array.from(sortTop(lncsorts, 'lncrna'));
        let dgTop = Array.from(sortTop(gsorts, 'dg'));
        let dmTop = Array.from(sortTop(misorts, 'dm'));
        let dlTop = Array.from(sortTop(lncsorts, 'dl'));
        lncrnas = Array.from(lncrnas);
        mirnas = Array.from(mirnas);
        genes = Array.from(genes);
        lncrnas.sort(sortThings);
        mirnas.sort(sortThings);
        genes.sort(sortThings);
        let lnclist = {}, milist = {}, genelist = {};
        lncrnas.forEach(item => lnclist[item] = null);
        mirnas.forEach(item => milist[item] = null);
        genes.forEach(item => genelist[item] = null);
        let disTop = Array.from(sortTop(results, 'dis'));
        let ddTop = Array.from(sortTop(ddsorts, 'dd'));
        diseases = Array.from(diseases);
        dis = {};
        diseases.sort(sortThings);
        diseases.forEach(item => dis[item] = null);

        db.collection('drugs').find({}).toArray(function(err, results) {
            if (err)
                throw err;
            let vcount = 0;
            for(let i=0;i<results.length;i++){
                if(results[i]._id !== 'vcount'){
                    drugs.push(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
                    if(results[i].PDBS){
                        for(let j=0;j<results[i].PDBS.length;j++){
                            dpcnt++;
                            pdbs.add(results[i].PDBS[j].PDB);
                            dpsorts.push({'Drug':results[i]._id,'Pdb':results[i].PDBS[j].PDB,'pcount':results[i].PDBS[j].pcount,'dpcount':results[i].PDBS[j].dpcount});
                            dppairs[results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' + results[i].PDBS[j].PDB] = null;
                        }
                    }
                }
                else{
                    vcount = results[i].count;
                }
            }
            let pdbTop = Array.from(sortTop(dpsorts, 'pdb'));
            let dpTop = Array.from(sortTop(dpsorts, 'dp'));
            pdbs = Array.from(pdbs);
            pdbs.sort(sortThings);
            let pdblist = {};
            pdbs.forEach(item => pdblist[item] = null);
            let drgTop = Array.from(sortTop(results, 'drg'));
            drugs = Array.from(drugs);
            drgs = {};
            drugs.sort(sortThings);
            drugs.forEach(item => drgs[item] = null);
            let message = ses.message;
            ses.message = '';
            resp.render('search', {
                ddpairs: ddpairs,
                dgpairs: dgpairs,
                dmpairs: dmpairs,
                dlpairs: dlpairs,
                dppairs: dppairs,
                diseases: dis,
                drugs: drgs,
                vcount:vcount,
                lncrnas: lnclist,
                mirnas: milist,
                genes: genelist,
                pdbs: pdblist,
                drgtop: drgTop,
                distop: disTop,
                ddtop: ddTop,
                dptop: dpTop,
                dgtop: dgTop,
                dmtop: dmTop,
                dltop: dlTop,
                genetop: geneTop,
                mirnatop: mirnaTop,
                lncrnatop: lncrnaTop,
                pdbtop: pdbTop,
                ddlength: ddsorts.length,
                druglength: drugs.length,
                dislength: diseases.length,
                dglength: dgcnt,
                dmlength: dmcnt,
                dllength: dlcnt,
                dplength: dpcnt,
                genelength: genes.length,
                lnclength: lncrnas.length,
                milength: mirnas.length,
                pdblength: pdbs.length,
                stats: ses.stats,
                message: message
            });
        });
    });
});
app.post('/search', (req, resp) => {
    ses = req.session;
    var retList = req.body.retObject;
    retList = JSON.parse(retList);
    console.log(retList);
    resp.redirect(`/${retList.categ}/${retList.search}`);
});
app.post('/feedback', (req, resp) => {
    ses = req.session;
    var retList = req.body;
    let sent = retList['sent'];
    let feed = retList['feed'];
    console.log(retList);
    db.collection("sfi").insertOne({'sid':sent,'Feed':feed},function(err, res) {
        if (err)
            throw err;
    });
    resp.send('Done');
});
app.get(`/All/categ=:sq/`, (req, resp) => {
    ses = req.session;
    let categ = req.params.sq;
    let filt,tab,q2,srt,sResults = new Set();
    if(categ === 'Drugs'){
        tab = 'drugs';
        filt = {};
        q2 = {'_id':1};
        srt = {'_id':1};
    }
    else if(categ === 'Diseases'){
        tab = 'diseases';
        filt = {};
        q2 = {'_id':1};
        srt = {'_id':1};
    }
    else if(categ === 'Drug-Disease'){
        tab = 'diseases';
        filt = {'Drug':{'$exists':true}};
        q2 = {'Drug':1};
        srt = {'_id':1};
    }
    else if(categ === 'Disease-Gene'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'HGNC','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1};
        srt = {'_id':1,'Genes.Gene':1};
    }
    else if(categ === 'Disease-miRNA'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'miRNA','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1};
        srt = {'_id':1,'Genes.Gene':1};
    }
    else if(categ === 'Disease-lncRNA'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'lncRNA','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1};
        srt = {'_id':1,'Genes.Gene':1};
    }
    else if(categ === 'Drug-PDB'){
        tab = 'drugs';
        filt = {'PDBS':{'$exists':true}};
        q2 = {'PDBS':1};
        srt = {'_id':1,'PDBS.PDB':1};
    }
    else if(categ === 'Genes'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'HGNC','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1,'_id':0};
        srt = {'Genes.Gene':1};
    }
    else if(categ === 'miRNAs'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'miRNA','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1,'_id':0};
        srt = {'Genes.Gene':1};
    }
    else if(categ === 'lncRNAs'){
        tab = 'diseases';
        filt = {'Genes':{'$exists':true},'Genes.Type':'lncRNA','Genes.Gene':{'$ne':null}};
        q2 = {'Genes':1,'_id':0};
        srt = {'Genes.Gene':1};
    }
    else if(categ === 'PDBs'){
        tab = 'drugs';
        filt = {'PDBS':{'$exists':true},'PDBS.PDB':{'$ne':null}};
        q2 = {'PDBS':1,'_id':0};
        srt = {'PDBS.PDB':1};
    }
    db.collection(tab).find(filt,{'projection':q2}).sort(srt).toArray( function(err, results) {
        if (err)
            throw err;
        let tmp = 0;
        if(categ === 'Drugs'){
            for(let i=0;i<results.length;i++){
                sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
            }
        }
        else if(categ === 'Diseases'){
            for(let i=0;i<results.length;i++){
                sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()));
            }
        }
        else if(categ === 'Drug-Disease'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Drug.length;j++){
                    sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' +results[i].Drug[j].Name.replace(/^\w/, c => c.toUpperCase()))
                }
            }
        }
        else if(categ === 'Disease-Gene'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'HGNC'){tmp++;
                        sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' +results[i].Genes[j].Gene);
                    }
                }
            }
        }
        else if(categ === 'Disease-miRNA'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'miRNA')
                        sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' +results[i].Genes[j].Gene);
                }
            }
        }
        else if(categ === 'Disease-lncRNA'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'lncRNA')
                        sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' +results[i].Genes[j].Gene);
                }
            }
        }
        else if(categ === 'Drug-PDB'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].PDBS.length;j++){
                    sResults.add(results[i]._id.replace(/^\w/, c => c.toUpperCase()) + '+' +results[i].PDBS[j].PDB)
                }
            }
        }
        else if(categ === 'Genes'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'HGNC')
                        sResults.add(results[i].Genes[j].Gene);
                }
            }
        }
        else if(categ === 'miRNAs'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'miRNA')
                        sResults.add(results[i].Genes[j].Gene);
                }
            }
        }
        else if(categ === 'lncRNAs'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].Genes.length;j++){
                    if(results[i].Genes[j].Type === 'lncRNA')
                        sResults.add(results[i].Genes[j].Gene);
                }
            }
        }
        else if(categ === 'PDBs'){
            for(let i=0;i<results.length;i++){
                for(let j=0;j<results[i].PDBS.length;j++){
                    sResults.add(results[i].PDBS[j].PDB)
                }
            }
        }
        sResults = Array.from(sResults);sResults.sort();
        let a = {
            gdis: sResults,
            categ: categ
        };
        getsearch(resp, 'allsearch', a);
    })
});
app.get(`/:gene(gene|miRNA|lncRNA)/:sq/d=:sq2`, (req, resp) => {
    ses = req.session;
    let gtype = req.params.gene;
    let gene = req.params.sq;
    let disease = req.params.sq2;
    let doid,gdis = [];
    db.collection('diseases').findOne({'_id':disease.toLowerCase(),'Genes.Gene':gene},{'projection':{'Genes.$':1,'Link':1}},function(err, results) {
        if (err)
            throw err;
        let q2 = '';
        if (results){
            q2 = results.Genes[0].dgid;
            doid = results.Link;
        }
        db.collection("gapm").findOne({'_id':q2}, function(err, results) {
            if (err)
                throw err;
            if(results){
                for(let i=0;i<results.Abstracts.length;i++){
                    curEntry = {};
                    curEntry['Abstract'] = results.Abstracts[i].Abstract.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['Ptitle'] = results.Abstracts[i].Ptitle.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['PDOI'] = results.Abstracts[i].PDOI;
                    gdis.push(curEntry);
                }
            }
            let a = {
                gdis: gdis,
                gene: gene,
                disease: disease,
                gtype: gtype,
                doid: doid
            };
            getsearch(resp, 'gresult', a);
        });
    });
});
app.get(`/pdb/:sq/d=:sq2`, (req, resp) => {
    ses = req.session;
    let pdb = req.params.sq;
    let drug = req.params.sq2;
    let dbankid,gdis = [];
    db.collection('drugs').findOne({'_id':drug.toLowerCase(),'PDBS.PDB':pdb},{'projection':{'PDBS.$':1,'Link':1}},function(err, results) {
        if (err)
            throw err;
        let q2 = '';
        if (results){
            q2 = results.PDBS[0].dpid;
            dbankid = results.Link;
        }
        db.collection("papm").findOne({'_id':q2}, function(err, results) {
            if (err)
                throw err;
            if(results){
                for(let i=0;i<results.Abstracts.length;i++){
                    curEntry = {};
                    curEntry['Abstract'] = results.Abstracts[i].Abstract.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['Ptitle'] = results.Abstracts[i].Ptitle.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['PDOI'] = results.Abstracts[i].PDOI;
                    gdis.push(curEntry);
                }
            }
            let a = {
                gdis: gdis,
                pdb: pdb,
                drug: drug,
                dbankid: dbankid
            };
            getsearch(resp, 'presult', a);
        });
    });
});
app.get('/Drug-Disease/:sq/dd=:sq2', (req, resp) => {
    ses = req.session;
    let tmp = req.params.sq.split('+');
    resp.redirect(`/Diseases/${tmp[0]}/dd=${tmp[1]}`);
});
app.get(`/:categ/:sq/dd=:sq2`, (req, resp) => {
    ses = req.session;
    let categ = req.params.categ;
    let drug, disease, dbankid, doid, label;
    if (categ === 'Drugs') {
        drug = req.params.sq;
        disease = req.params.sq2;
    } else if (categ === 'Diseases') {
        drug = req.params.sq2;
        disease = req.params.sq;
    }
    let sps = [];
    db.collection('diseases').findOne({'_id':disease.toLowerCase(),'Drug.Name':drug.toLowerCase()},{'projection':{'Drug.$':1,'Link':1}},function(err, results) {
        if (err)
            throw err;
        let q2 = '';
        if (results){
            q2 = results.Drug[0].ddid;
            dbankid = results.Drug[0].Link;
            label = results.Drug[0].Label;
            doid = results.Link;
        }
        db.collection("spm").findOne({'_id':q2}, function(err, results) {
            if (err)
                throw err;
            if(results){
                for(let i=0;i<results.Sentences.length;i++){
                    curEntry = {};
                    curEntry['Sid'] = results.Sentences[i].sid;
                    curEntry['sentence'] = results.Sentences[i].Sentence.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['paper'] = results.Sentences[i].Ptitle.replace(/[\\"]/g, '\\$&').replace(/[\\']/g, '\$&').replace(/\u0000/g, '\\0');
                    curEntry['doi'] = results.Sentences[i].PDOI;
                    sps.push(curEntry);
                }
            }
            let a = {
                sps: sps,
                drug: drug,
                dbankid: dbankid,
                doid: doid,
                disease: disease,
                stats: categ,
                label: label
            };
            getsearch(resp, 'ddresult', a);
        });
    });
});
app.get(`/:categ(Drugs|Diseases|Drug-Disease)/:sq`, (req, resp) => {
    ses = req.session;
    let categ = req.params.categ;
    let query = req.params.sq.replace(/^\w/, c => c.toUpperCase());
    let qsplit = query.split('+');
    let posStats = {};
    let poscnt = 0, negcnt = 0;
    let sResults = [], seResults = [], gResults = [], pResults = [], lncResults = [], miResults = [];
    if (categ === 'Drugs' || categ === 'Drug-Disease') {
        let upd,filt,proj;
        if(categ === 'Drugs'){
            filt = {'_id':query.toLowerCase()};
            upd = {'$inc': {'drgcnt':1}};
            proj = {};
        }else if(categ === 'Drug-Disease'){
            filt = {'_id':qsplit[1].toLowerCase(),'Disease.Name':qsplit[0].toLowerCase()};
            upd = {'$setOnInsert': {'CName':'$CName'}};
            proj = {
                projection: {'Disease.$':1,'PDBS':1,'SEffects':1,'Link':1}
            };
        }
        db.collection('drugs').findOneAndUpdate(filt,upd,proj,function(err, results) {
            if (err)
                throw err;
            if (results.value) {//console.log(results);
                if(results.value.Disease){
                    for(let j=0;j<results.value.Disease.length;j++){
                        curEntry = {};
                        curEntry['desc'] = '';
                        curEntry['Drug'] = results.value._id.replace(/^\w/, c => c.toUpperCase());
                        curEntry['Dbankid'] = results.value.Link;
                        curEntry['DOID'] = results.value.Disease[j].Link;
                        curEntry['Disease'] = results.value.Disease[j].Name.replace(/^\w/, c => c.toUpperCase());
                        curEntry['Label'] = results.value.Disease[j].Label;
                        curEntry['Conf'] = results.value.Disease[j].Conf;
                        curEntry['Status'] = results.value.Disease[j].Stats;
                        if (curEntry.Label === 'Positive')
                            poscnt++;
                        else if (curEntry.Label === 'Negative')
                            negcnt++;
                        sResults.push(curEntry);
                    }
                }
                if(results.value.PDBS){
                    for(let j=0;j<results.value.PDBS.length;j++){
                        pResults.push(results.value.PDBS[j].PDB);
                    }
                }
                if(results.value.SEffects){
                    for(let j=0;j<results.value.SEffects.length;j++){
                        seResults.push(results.value.SEffects[j]);
                    }
                }
            }
            posStats['Positive'] = poscnt;
            posStats['Negative'] = negcnt;
            if(categ === 'Drugs'){
                sResults.sort(confSort);
                let a = {
                    sResults: sResults,
                    seResults: seResults,
                    pResults: pResults,
                    miResults: miResults,
                    lncResults: lncResults,
                    gResults: gResults,
                    posStats: posStats,
                    query: query,
                    stats: categ
                };
                if(sResults.length ===0 && pResults.length ===0 && seResults.length ===0 && gResults.length ===0 && miResults.length ===0 && lncResults.length ===0) {
                    ses.message = 'Error';
                    resp.redirect('/search');
                }else
                    getsearch(resp, 'login', a);
            }
        });
    }
    if (categ === 'Diseases' || categ === 'Drug-Disease') {
        let filt,upd;
        if(categ === 'Diseases'){
            filt = {'_id':query.toLowerCase()};
            upd = {'$inc': {'discnt':1}};
        }else if(categ === 'Drug-Disease'){
            filt = {'_id':qsplit[0].toLowerCase(),'Drug.Name':qsplit[1].toLowerCase()};
            upd = {'$inc': {'Drug.$.ddcnt':1}};
        }
        db.collection('diseases').findOneAndUpdate(filt,upd,function(err, results) {
            if (err)
                throw err;
            if (results.value) {//console.log(results);
                if(results.value.Drug){
                    if(categ === 'Diseases'){
                        for(let j=0;j<results.value.Drug.length;j++){
                            curEntry = {};
                            curEntry['desc'] = '';
                            curEntry['Disease'] = results.value._id.replace(/^\w/, c => c.toUpperCase());
                            curEntry['DOID'] = results.value.Link;
                            curEntry['Dbankid'] = results.value.Drug[j].Link;
                            curEntry['Drug'] = results.value.Drug[j].Name.replace(/^\w/, c => c.toUpperCase());
                            curEntry['Label'] = results.value.Drug[j].Label;
                            curEntry['Conf'] = results.value.Drug[j].Conf;
                            curEntry['Status'] = results.value.Drug[j].Stats;
                            if (curEntry.Label === 'Positive')
                                poscnt++;
                            else if (curEntry.Label === 'Negative')
                                negcnt++;
                            sResults.push(curEntry);
                        }
                    } else if(categ === 'Drug-Disease'){
                        sResults[0].DOID = results.value.Link;
                    }
                }
                if(results.value.Genes){
                    for(let j=0;j<results.value.Genes.length;j++){
                        curEntry = {};
                        curEntry['Gene'] = results.value.Genes[j].Gene;
                        curEntry['Type'] = results.value.Genes[j].Type;
                        curEntry['Conf'] = results.value.Genes[j].Conf;
                        if (curEntry['Type'] === 'lncRNA')
                            lncResults.push(curEntry);
                        else if (curEntry['Type'] === 'miRNA')
                            miResults.push(curEntry);
                        else
                            gResults.push(curEntry);
                    }
                }
            }
            posStats['Positive'] = poscnt;
            posStats['Negative'] = negcnt;
            sResults.sort(confSort);
            gResults.sort(confSort);
            miResults.sort(confSort);
            lncResults.sort(confSort);
            let a = {
                sResults: sResults,
                seResults: seResults,
                pResults: pResults,
                miResults: miResults,
                lncResults: lncResults,
                gResults: gResults,
                posStats: posStats,
                query: query,
                stats: categ
            };
            if(sResults.length ===0 && pResults.length ===0 && seResults.length ===0 && gResults.length ===0 && miResults.length ===0 && lncResults.length ===0) {
                ses.message = 'Error';
                resp.redirect('/search');
            }else
                getsearch(resp, 'login', a);
        });
    }
});
app.get(`/:categ(PDBs|Drug-PDB)/:sq`, (req, resp) => {
    ses = req.session;
    let categ = req.params.categ;
    let query = req.params.sq;
    let qsplit = query.split('+');
    let sResults = [], seResults = [];
    let upd,filt,proj;
    if(categ === 'PDBs'){
        filt = {'PDBS.PDB':query};
        upd = {'$inc': {'PDBS.$.pcount':1}};
        proj = {
            projection: {'PDBS.$':1,'Link':1}
        };
    }else if(categ === 'Drug-PDB'){
        filt = {'_id':qsplit[0].toLowerCase(),'PDBS.PDB':qsplit[1]};
        upd = {'$inc': {'PDBS.$.dpcount':1}};
        proj = {
            projection: {'PDBS.$':1,'Link':1,'SEffects':1}
        };
    }
    db.collection('drugs').find(filt,proj).toArray(function(err, results) {
        if (err)
            throw err;
        if (results.length !== 0) {//console.log(results);
            for(let i=0;i<results.length;i++){
                curEntry = {};
                curEntry['Drug'] = results[i]._id.replace(/^\w/, c => c.toUpperCase());
                curEntry['Pdb'] = results[i].PDBS[0].PDB;
                curEntry['Dbankid'] = results[i].Link;
                sResults.push(curEntry);
                if(results[i].SEffects){
                    for(let j=0;j<results[i].SEffects.length;j++){
                        seResults.push(results[i].SEffects[j]);
                    }
                }
            }
        }
        db.collection("drugs").updateMany(filt, upd, function(err, res) {
            if (err)
                throw err;
        });
        let a = {
            sResults: sResults,
            seResults: seResults,
            query: query,
            stats: categ
        };
        if(sResults.length ===0 && seResults.length ===0){
            ses.message = 'Error';
            resp.redirect('/search');
        } else
            getsearch(resp, 'lresult', a);
    });
});
app.get(`/:categ(Genes|miRNAs|lncRNAs|Disease-Gene|Disease-miRNA|Disease-lncRNA)/:sq`, (req, resp) => {
    ses = req.session;
    let categ = req.params.categ;
    let query = req.params.sq;
    let qsplit = query.split('+');
    let sResults = [];
    let upd,filt,proj;
    if(categ === 'Genes' || categ === 'miRNAs' || categ === 'lncRNAs'){
        filt = {'Genes.Gene':query};
        upd = {'$inc': {'Genes.$.gcount':1}};
        proj = {
            projection: {'Genes.$':1,'Link':1}
        };
    }else if(categ === 'Disease-Gene' || categ === 'Disease-miRNA' || categ === 'Disease-lncRNA'){
        filt = {'_id':qsplit[0].toLowerCase(),'Genes.Gene':qsplit[1]};
        upd = {'$inc': {'Genes.$.dgcount':1}};
        proj = {
            projection: {'Genes.$':1,'Link':1}
        };
    }
    db.collection('diseases').find(filt,proj).toArray(function(err, results) {
        if (err)
            throw err;
        if (results.length !== 0) {//console.log(results);
            for(let i=0;i<results.length;i++){
                curEntry = {};
                curEntry['Disease'] = results[i]._id.replace(/^\w/, c => c.toUpperCase());
                curEntry['Gene'] = results[i].Genes[0].Gene;
                curEntry['ConfType'] = results[i].Genes[0].Conf;
                curEntry['DOID'] = results[i].Link;
                sResults.push(curEntry);
            }
        }
        db.collection("diseases").updateMany(filt, upd, function(err, res) {
            if (err)
                throw err;
        });
        let a = {
            sResults: sResults,
            query: query,
            stats: categ
        };
        if(sResults.length ===0){
            ses.message = 'Error';
            resp.redirect('/search');
        } else
            getsearch(resp, 'mresult', a);
    });
});
app.get('/redirects', (req, resp) => {
    ses = req.session;
    resp.redirect('/search');
});
app.use(function(req, res) {
    res.redirect('/search')
});
app.listen('3000', () => {
    console.log('server started on port 3000')
});
